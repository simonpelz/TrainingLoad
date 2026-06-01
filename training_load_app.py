"""
training_load_app_gui.py

Interactive desktop application (Tkinter + Matplotlib) that:
 - accepts multiple CSV files (each may contain activity rows with columns 'WorkoutDay' and 'TSS')
 - aggregates activities per calendar day (summing multiple activities per day)
 - treats missing / non-numeric TSS as 0
 - computes CTL (tau default 42), ATL (tau default 7) via recursive EWMA and TSB = CTL - ATL
 - pads future days with zero TSS for forecasting and plots future values as dotted lines
 - interactive features: hover annotations showing values at the hovered date, togglable series (TSS / CTL / ATL / TSB), timeframe presets (last 30/90 days, year-to-date, all) and Matplotlib zoom/pan toolbar
 - simple save/export (save aggregated CSV, save current plot as PNG)

Dependencies:
  - Python 3.8+
  - pandas, numpy, matplotlib
  - mplcursors (optional but recommended for better hover labels; if not available a basic hover fallback is used)

Drop this file into your IDE and run. The UI is self-contained.

"""

from __future__ import annotations

import math
import os
from datetime import datetime, timedelta
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkcalendar import DateEntry

import numpy as np
import pandas as pd
import matplotlib
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
from matplotlib.figure import Figure

import threading


# ------------------------- Data utilities (same core calculations) -------------------------

def read_and_aggregate_multiple(csv_paths: list[str], workout_col: str = 'WorkoutDay', tss_col: str = 'TSS') -> pd.Series:
    """Read multiple CSV files, parse dates, fill missing TSS with 0, aggregate sum TSS per calendar day across all files."""
    dfs = []
    for p in csv_paths:
        df = pd.read_csv(p)
        # Ensure columns exist
        if workout_col not in df.columns:
            raise KeyError(f"Date column '{workout_col}' not found in {p}")
        if tss_col not in df.columns:
            df[tss_col] = 0.0
        df[workout_col] = pd.to_datetime(df[workout_col], errors='coerce')
        df = df.dropna(subset=[workout_col])
        df[workout_col] = df[workout_col].dt.normalize()
        df[tss_col] = pd.to_numeric(df[tss_col], errors='coerce').fillna(0.0)
        dfs.append(df[[workout_col, tss_col]])
    if not dfs:
        return pd.Series(dtype=float)
    big = pd.concat(dfs, ignore_index=True)
    grouped = big.groupby(workout_col)[tss_col].sum().sort_index()
    return grouped


def make_daily_series(daily_tss: pd.Series, start: pd.Timestamp | None = None, end: pd.Timestamp | None = None) -> pd.Series:
    if start is None:
        start = daily_tss.index.min()
    if end is None:
        end = daily_tss.index.max()
    full_idx = pd.date_range(start=start, end=end, freq='D')
    full = pd.Series(0.0, index=full_idx)
    full.update(daily_tss)
    return full


def ewma_recursive(series: pd.Series, tau: float) -> pd.Series:
    if tau <= 0:
        raise ValueError('tau must be positive')
    alpha = 1.0 - math.exp(-1.0 / float(tau))
    vals = series.values.astype(float)
    s = np.zeros_like(vals)
    prev = 0.0
    for i, x in enumerate(vals):
        curr = prev + alpha * (x - prev)
        s[i] = curr
        prev = curr
    return pd.Series(s, index=series.index)


def compute_ctl_atl_tsb(daily_tss: pd.Series, tau_ctl: float = 42.0, tau_atl: float = 7.0) -> pd.DataFrame:
    full = make_daily_series(daily_tss)
    ctl = ewma_recursive(full, tau=tau_ctl)
    atl = ewma_recursive(full, tau=tau_atl)
    tsb = ctl - atl
    df = pd.DataFrame({'TSS': full, 'CTL': ctl, 'ATL': atl, 'TSB': tsb})
    return df


def extend_series_with_future(daily_tss: pd.Series, future_days: int, tau_ctl: float = 42.0, tau_atl: float = 7.0) -> pd.DataFrame:
    """Extend the original daily_tss Series by future_days with zeros and recompute metrics across the extended range.
    This avoids any ambiguity caused by passing a metrics DataFrame into the extender.
    """
    if future_days <= 0:
        return compute_ctl_atl_tsb(daily_tss, tau_ctl=tau_ctl, tau_atl=tau_atl)
    last = daily_tss.index.max()
    future_index = pd.date_range(start=last + pd.Timedelta(days=1), periods=future_days, freq='D')
    future_series = pd.Series(0.0, index=future_index)
    concatenated = pd.concat([daily_tss, future_series])
    concatenated = concatenated.sort_index()
    extended = compute_ctl_atl_tsb(concatenated, tau_ctl=tau_ctl, tau_atl=tau_atl)
    return extended


# ------------------------- GUI Application -------------------------

class TrainingLoadApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Training Load Viewer (CTL / ATL / TSB)')
        self.geometry('1100x700')

        # Data attributes
        self.daily_tss: pd.Series | None = None
        self.metrics: pd.DataFrame | None = None
        self.extended: pd.DataFrame | None = None
        self.last_actual_date: pd.Timestamp | None = None
        self.current_files: list[str] = []

        # Defaults
        self.tau_ctl = tk.DoubleVar(value=42.0)
        self.tau_atl = tk.DoubleVar(value=7.0)
        self.future_days = tk.IntVar(value=30)

        # Visibility toggles
        self.show_tss = tk.BooleanVar(value=True)
        self.show_ctl = tk.BooleanVar(value=True)
        self.show_atl = tk.BooleanVar(value=True)
        self.show_tsb = tk.BooleanVar(value=False)

        # Timeframe selection
        self.timeframe = tk.StringVar(value='Last 365 days')
        self.start_date = tk.StringVar(value=None)
        self.end_date = tk.StringVar(value=None)
        
        # Y-axis limits
        self.scale_to_tss = tk.BooleanVar(value=False)
        self.scale_to_tsb = tk.BooleanVar(value=False)

        self._build_ui()

    def _build_ui(self):
        topframe = ttk.Frame(self)
        topframe.pack(side=tk.TOP, fill=tk.X, padx=6, pady=6)

        btn_load = ttk.Button(topframe, text='Load CSV(s)...', command=self.load_files)
        btn_load.pack(side=tk.LEFT)

        ttk.Label(topframe, text=' τ_CTL').pack(side=tk.LEFT, padx=(8, 0))
        ttk.Entry(topframe, textvariable=self.tau_ctl, width=6).pack(side=tk.LEFT)
        ttk.Label(topframe, text=' τ_ATL').pack(side=tk.LEFT, padx=(8, 0))
        ttk.Entry(topframe, textvariable=self.tau_atl, width=6).pack(side=tk.LEFT)

        ttk.Label(topframe, text=' Future days').pack(side=tk.LEFT, padx=(8, 0))
        ttk.Entry(topframe, textvariable=self.future_days, width=6).pack(side=tk.LEFT)

        ttk.Button(topframe, text='Recompute & Plot', command=self.recompute_and_plot).pack(side=tk.LEFT, padx=8)

        ttk.Checkbutton(topframe, text='Scale Y to TSS', variable=self.scale_to_tss, command=self.recompute_and_plot).pack(side=tk.RIGHT, padx=(6))
        ttk.Checkbutton(topframe, text='Scale Y to TSB', variable=self.scale_to_tsb, command=self.recompute_and_plot).pack(side=tk.RIGHT)


        # Checkbuttons for toggling series
        cbframe = ttk.Frame(self)
        cbframe.pack(side=tk.TOP, fill=tk.X, padx=6)
        ttk.Checkbutton(cbframe, text='TSS', variable=self.show_tss, command=self.update_visibility).pack(side=tk.LEFT)
        ttk.Checkbutton(cbframe, text='CTL', variable=self.show_ctl, command=self.update_visibility).pack(side=tk.LEFT)
        ttk.Checkbutton(cbframe, text='ATL', variable=self.show_atl, command=self.update_visibility).pack(side=tk.LEFT)
        ttk.Checkbutton(cbframe, text='TSB', variable=self.show_tsb, command=self.update_visibility).pack(side=tk.LEFT)
        
        # Timeframe dropdown
        timeframe_options = ['All', 'Last 90 days', 'Year to date', 'Last 365 days',]
        ttk.Label(cbframe, text='   View:').pack(side=tk.LEFT, padx=(12, 0))
        timeframe_menu = ttk.OptionMenu(cbframe, self.timeframe, self.timeframe.get(), *timeframe_options, command=lambda _: self.set_timeframe())
        timeframe_menu.pack(side=tk.LEFT)
        # Manual timeframe inputs with DateEntry
        manual_frame = ttk.Frame(cbframe)
        manual_frame.pack(side=tk.LEFT, padx=(12, 0))

        ttk.Label(manual_frame, text="Start:").pack(side=tk.LEFT)
        DateEntry(manual_frame, textvariable=self.start_date, width=12,
                date_pattern='yyyy-mm-dd').pack(side=tk.LEFT, padx=2)

        ttk.Label(manual_frame, text="End:").pack(side=tk.LEFT)
        DateEntry(manual_frame, textvariable=self.end_date, width=12,
                date_pattern='yyyy-mm-dd').pack(side=tk.LEFT, padx=2)
        self.start_date.set('')
        self.end_date.set('')

        ttk.Button(manual_frame, text="Apply", command=self.apply_timeframe).pack(side=tk.LEFT, padx=6)

        # Save buttons
        ttk.Button(cbframe, text='Save CSV', command=self.save_csv).pack(side=tk.RIGHT, padx=6)
        ttk.Button(cbframe, text='Save Plot PNG', command=self.save_plot).pack(side=tk.RIGHT)

        # Matplotlib figure (single main axis — TSS bars + CTL/ATL/TSB lines all plotted here)
        self.fig = Figure(figsize=(10, 5), dpi=100)
        self.ax_main = self.fig.add_subplot(111)
        self.fig.tight_layout(pad=3.0)

        self.canvas = FigureCanvasTkAgg(self.fig, master=self)
        self.canvas_widget = self.canvas.get_tk_widget()
        self.canvas_widget.pack(side=tk.TOP, fill=tk.BOTH, expand=1)

        toolbar = NavigationToolbar2Tk(self.canvas, self)
        toolbar.update()
        self.canvas._tkcanvas.pack(side=tk.TOP, fill=tk.BOTH, expand=1)

        # Store plotted artists
        self.artists = {'tss_bars': None, 'ctl_line': None, 'atl_line': None, 'tsb_line': None, 'future_ctl': None, 'future_atl': None, 'future_tsb': None}

        # Hover annotation (mplcursors or fallback)
        self.cursor_handlers = []

        try:
            daily = read_and_aggregate_multiple(["default.csv"])  # Load a default file if available
        except Exception as e:
            return
        self.current_files = ["default.csv"]
        self.daily_tss = daily
        self.recompute_and_plot()

    # -------------------- Data loading and computation --------------------
    def load_files(self):
        paths = filedialog.askopenfilenames(title='Select activity CSV files', filetypes=[('CSV files', '*.csv'), ('All files', '*.*')])
        if not paths:
            return
        try:
            daily = read_and_aggregate_multiple(list(paths))
        except Exception as e:
            messagebox.showerror('Error reading files', str(e))
            return
        self.current_files = list(paths)
        self.daily_tss = daily
        messagebox.showinfo('Loaded', f'Loaded {len(self.current_files)} files. {len(self.daily_tss)} days with activities present.')
        # Autoplot
        self.recompute_and_plot()

    def recompute_and_plot(self):
        if self.daily_tss is None or self.daily_tss.empty:
            messagebox.showwarning('No data', 'Load CSV files first')
            return
        try:
            tau_ctl = float(self.tau_ctl.get())
            tau_atl = float(self.tau_atl.get())
            future_days = int(self.future_days.get())
        except Exception as e:
            messagebox.showerror('Invalid parameters', str(e))
            return

        # Compute metrics on historical data
        metrics = compute_ctl_atl_tsb(self.daily_tss, tau_ctl=tau_ctl, tau_atl=tau_atl)
        self.metrics = metrics
        self.last_actual_date = metrics.index.max()
        # Extend using the original daily_tss series (avoids index-type issues)
        self.extended = extend_series_with_future(self.daily_tss, future_days=future_days, tau_ctl=tau_ctl, tau_atl=tau_atl)
        self._draw_plot()

    # -------------------- Plotting --------------------
    def _clear_artists(self):
        for key, art in self.artists.items():
            if art is None:
                continue
            try:
                if isinstance(art, (list, tuple)):
                    for a in art:
                        a.remove()
                else:
                    art.remove()
            except Exception:
                pass
        # reset
        for k in list(self.artists.keys()):
            self.artists[k] = None
        # clear cursors
        for h in self.cursor_handlers:
            try:
                h.remove()
            except Exception:
                pass
        self.cursor_handlers = []

    def _draw_plot(self):
        self._clear_artists()
        df = self.extended
        if df is None:
            return
        dates = df.index
        tss = df['TSS'].values
        ctl = df['CTL'].values
        atl = df['ATL'].values
        tsb = df['TSB'].values

        mask_hist = dates <= self.last_actual_date
        mask_future = dates > self.last_actual_date

        self.ax_main.clear()

        # Bars for TSS
        bars = self.ax_main.bar(dates, tss, label='TSS', alpha=0.6, color="#d9ae94", width=0.8, zorder=2)
        self.artists['tss_bars'] = bars

        # CTL/ATL lines (solid for history)
        if mask_hist.any():
            atl_hist_line, = self.ax_main.plot(dates[mask_hist], atl[mask_hist], label='ATL (fatigue)', linewidth=2,color="#ffcb69")
            tsb_hist_line, = self.ax_main.plot(dates[mask_hist], tsb[mask_hist], label='TSB (form)', linewidth=1, color="#997b66")
            ctl_hist_line, = self.ax_main.plot(dates[mask_hist], ctl[mask_hist], label='CTL (fitness)', linewidth=3,color="#797d62")
            self.artists['atl_line'] = atl_hist_line
            self.artists['tsb_line'] = tsb_hist_line
            self.artists['ctl_line'] = ctl_hist_line

        else:
            self.artists['atl_line'] = None
            self.artists['tsb_line'] = None
            self.artists['ctl_line'] = None

        # Future dotted lines for continuity (prepend last historical value for continuity)
        if mask_future.any() and mask_hist.any():
            last_hist_idx = np.where(mask_hist)[0][-1]
            mask_last_hist = np.zeros_like(mask_future, dtype=bool)
            mask_last_hist[last_hist_idx] = True
            future_x = np.concatenate((dates[mask_last_hist], dates[mask_future]))
            future_ctl = np.concatenate(([ctl[last_hist_idx]], ctl[mask_future]))
            future_atl = np.concatenate(([atl[last_hist_idx]], atl[mask_future]))
            future_tsb = np.concatenate(([tsb[last_hist_idx]], tsb[mask_future]))
            f_atl_line, = self.ax_main.plot(future_x, future_atl, linestyle='--', linewidth=1, color= "#f1dca7")
            f_tsb_line, = self.ax_main.plot(future_x, future_tsb, linestyle='--', linewidth=1,color="#d08c60")
            f_ctl_line, = self.ax_main.plot(future_x, future_ctl, linestyle='--', linewidth=1, color="#9b9b7a")
            self.artists['future_atl'] = f_atl_line
            self.artists['future_tsb'] = f_tsb_line
            self.artists['future_ctl'] = f_ctl_line
        else:
            self.artists['future_atl'] = None
            self.artists['future_tsb'] = None
            self.artists['future_ctl'] = None

        # Styling
        self.ax_main.set_title('Daily TSS with CTL / ATL / TSB')
        self.ax_main.set_ylabel('Load / TSB')
        self.ax_main.axhline(0, color='gray', linestyle=':', linewidth=0.6)

        # Legend
        self.ax_main.legend()
        
        # rescale y-axis
        ymin = 0.0
        ymax = max(ctl.max(), atl.max(), tsb.max())
        if self.scale_to_tss.get(): ymax = tss.max()
        if self.scale_to_tsb.get(): ymin = tsb.min()
        self.ax_main.set_ylim(ymin,ymax)

        self.fig.tight_layout()
        self.canvas.draw_idle()
        self._fallback_hover_setup()

        # Apply visibility settings
        self.update_visibility()
        # Apply selected timeframe
        self.apply_timeframe()

    def _fallback_hover_setup(self):
        self._annot = self.ax_main.annotate(
    '',
            xy=(0, 0),
            xytext=(15, 15),
            textcoords='offset points',
            bbox=dict(boxstyle='round', fc='w'))
        self._annot.set_visible(False)

        self._hover_timer = None
        self._last_idx = None

        def show_annotation(idx):
            date = self.extended.index[idx]
            vals = self.extended.iloc[idx]
            txt = (
                f"{date.date()}\n"
                f"TSS: {vals['TSS']:.1f}\n"
                f"Fitness (CTL): {vals['CTL']:.1f}\n"
                f"Fatigue (ATL): {vals['ATL']:.1f}\n"
                f"Form (TSB): {vals['TSB']:.1f}"
            )
            y_for_annot = float(vals['CTL'])
            self._annot.xy = (matplotlib.dates.date2num(date), y_for_annot)
            self._annot.set_text(txt)
            self._annot.set_visible(True)
            self.canvas.draw_idle()

        def on_move(event):
            if event.inaxes is not self.ax_main or event.xdata is None:
                return

            xdate = matplotlib.dates.num2date(event.xdata).replace(tzinfo=None)
            if self.extended is None:
                return

            deltas = np.abs((self.extended.index - pd.Timestamp(xdate)).days)
            idx = int(deltas.argmin())

            # Only restart timer if we're on a different data point
            if idx != self._last_idx:
                self._last_idx = idx
                if self._hover_timer is not None:
                    self._hover_timer.cancel()
                self._hover_timer = threading.Timer(0.25, show_annotation, args=(idx,))
                self._hover_timer.start()

        def on_leave(event):
            if hasattr(self, '_annot'):
                self._annot.set_visible(False)
                self.canvas.draw_idle()
            if self._hover_timer is not None:
                self._hover_timer.cancel()

        self.canvas.mpl_connect('motion_notify_event', on_move)
        self.canvas.mpl_connect('figure_leave_event', on_leave)



    # -------------------- Interactivity --------------------
    def update_visibility(self):
        # Toggle visibility of plotted artists based on checkboxes
        def safe_set_visible(artist, vis):
            if artist is None:
                return
            try:
                if isinstance(artist, matplotlib.container.BarContainer):
                    for r in artist:
                        r.set_visible(vis)
                else:
                    artist.set_visible(vis)
            except Exception:
                pass

        # TSS bars
        safe_set_visible(self.artists.get('tss_bars'), self.show_tss.get())
        safe_set_visible(self.artists.get('ctl_line'), self.show_ctl.get())
        safe_set_visible(self.artists.get('atl_line'), self.show_atl.get())
        # future lines visibility follows the same toggles
        safe_set_visible(self.artists.get('future_ctl'), self.show_ctl.get())
        safe_set_visible(self.artists.get('future_atl'), self.show_atl.get())
        # TSB
        safe_set_visible(self.artists.get('tsb_line'), self.show_tsb.get())
        safe_set_visible(self.artists.get('future_tsb'), self.show_tsb.get())

        self.canvas.draw_idle()

    def set_timeframe(self):
        if self.extended is None:
            return
        mode = self.timeframe.get()
        end = self.extended.index.max()
        if mode == 'All':
            start = self.extended.index.min()
        elif mode == 'Last 30 days':
            start = end - pd.Timedelta(days=29)
        elif mode == 'Last 90 days':
            start = end - pd.Timedelta(days=89)
        elif mode == 'Last 365 days':
            start = end - pd.Timedelta(days=364)
        elif mode == 'Year to date':
            start = pd.Timestamp(year=end.year, month=1, day=1)
        else:
            start = self.extended.index.min()
        self.start_date.set(str(start.date()))
        self.end_date.set(str(end.date()))
        self.apply_timeframe()
        
    def apply_timeframe(self):
        if self.extended is None:return
        if self.start_date.get() == '' or self.end_date.get() == '':
            self.set_timeframe()
        try:
            start = pd.to_datetime(self.start_date.get())
            end = pd.to_datetime(self.end_date.get())
        except Exception:
            messagebox.showwarning('Invalid date', 'Please enter valid start and end dates in YYYY-MM-DD format!')
            return

        # clamp to dataset
        if start < self.extended.index.min():
            start = self.extended.index.min()
        if end > self.extended.index.max():
            end = self.extended.index.max()

        if start > end:
            messagebox.showwarning('Invalid timeframe', 'Start date cannot be after end date!')
            return

        self.ax_main.set_xlim(start, end + pd.Timedelta(days=1))
        self.canvas.draw_idle()

    # -------------------- Saving --------------------
    def save_csv(self):
        if self.extended is None:
            messagebox.showwarning('No data', 'Nothing to save — load data first')
            return
        p = filedialog.asksaveasfilename(title='Save aggregated CSV', defaultextension='.csv', filetypes=[('CSV files', '*.csv')])
        if not p:
            return
        df = self.extended.copy()
        df_out = df.reset_index()
        df_out.rename(columns={'index': 'WorkoutDay'}, inplace=True)
        df_out.to_csv(p, index=True,)
        messagebox.showinfo('Saved', f'Wrote {p}')

    def save_plot(self):
        if self.extended is None:
            messagebox.showwarning('No data', 'Nothing to save — load data first')
            return
        p = filedialog.asksaveasfilename(title='Save plot image', defaultextension='.png', filetypes=[('PNG image', '*.png')])
        if not p:
            return
        self.fig.savefig(p, dpi=150)
        messagebox.showinfo('Saved', f'Wrote {p}')


# ------------------------- Run -------------------------

def main():
    app = TrainingLoadApp()
    app.mainloop()


if __name__ == '__main__':
    main()
