import { useMemo } from 'react'
import type { BarSeriesOption, EChartsOption, LineSeriesOption } from 'echarts'
import { ReactECharts, echarts } from '@/lib/echarts'
import type { MetricsPoint } from '@/core'
import { lastActualIndex } from '@/lib/interpretation'
import type { SeriesVisibility, TimeframePreset } from './Controls'

const COLORS = {
  fitness: '#14b8a6',
  fatigue: '#f97316',
  form: '#8b5cf6',
}

type MetricKey = 'ctl' | 'atl' | 'tsb'

interface LoadChartProps {
  metrics: MetricsPoint[]
  visible: SeriesVisibility
  dark: boolean
  timeframe: TimeframePreset
  onReady?: (instance: unknown) => void
}

function startIndex(len: number, tf: TimeframePreset): number {
  if (tf === 'all') return 0
  return Math.max(0, len - 1 - Number(tf))
}

export function LoadChart({ metrics, visible, dark, timeframe, onReady }: LoadChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const dates = metrics.map((p) => p.date)
    const lastIdx = lastActualIndex(metrics)

    const axisColor = dark ? '#94a3b8' : '#475569'
    const splitColor = dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.15)'
    const tssColor = dark ? 'rgba(148,163,184,0.40)' : 'rgba(100,116,139,0.35)'

    // Each metric becomes a solid "actual" line plus a dashed "forecast" line
    // that reconnects at the last real day.
    const actual = (key: MetricKey) => metrics.map((p) => (p.isForecast ? null : p[key]))
    const forecast = (key: MetricKey) =>
      metrics.map((p, i) => (p.isForecast || i === lastIdx ? p[key] : null))

    const line = (
      key: MetricKey,
      color: string,
      width: number,
      dashed: boolean,
      data: (number | null)[],
    ): LineSeriesOption => ({
      type: 'line',
      name: key,
      data,
      yAxisIndex: 0,
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width, color, type: dashed ? 'dashed' : 'solid' },
      z: 3,
    })

    const series: (LineSeriesOption | BarSeriesOption)[] = []

    if (visible.tss) {
      series.push({
        type: 'bar',
        name: 'tss',
        yAxisIndex: 1,
        data: metrics.map((p) => (p.isForecast ? null : p.tss)),
        itemStyle: { color: tssColor },
        barWidth: '60%',
        z: 1,
      })
    }
    if (visible.atl) {
      series.push(line('atl', COLORS.fatigue, 2, false, actual('atl')))
      series.push(line('atl', COLORS.fatigue, 1.5, true, forecast('atl')))
    }
    if (visible.tsb) {
      series.push(line('tsb', COLORS.form, 1.5, false, actual('tsb')))
      series.push(line('tsb', COLORS.form, 1.5, true, forecast('tsb')))
    }
    if (visible.ctl) {
      series.push(line('ctl', COLORS.fitness, 3, false, actual('ctl')))
      series.push(line('ctl', COLORS.fitness, 2, true, forecast('ctl')))
    }

    // Always-present zero reference line on the left axis.
    series.push({
      type: 'line',
      name: '__zero',
      data: dates.map(() => null),
      yAxisIndex: 0,
      silent: true,
      showSymbol: false,
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        lineStyle: { type: 'dashed', color: axisColor, opacity: 0.5 },
        data: [{ yAxis: 0 }],
      },
      tooltip: { show: false },
      z: 0,
    })

    const start = startIndex(dates.length, timeframe)

    return {
      animation: false,
      grid: { top: 16, right: 52, bottom: 64, left: 52 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: dark ? '#0b1220' : '#ffffff',
        borderColor: splitColor,
        textStyle: { color: dark ? '#e2e8f0' : '#0f172a' },
        formatter: (raw: unknown) => {
          const arr = Array.isArray(raw) ? raw : [raw]
          const di = (arr[0] as { dataIndex: number }).dataIndex
          const p = metrics[di]
          if (!p) return ''
          const dot = (c: string) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${c};margin-right:6px"></span>`
          const rowHtml = (c: string, label: string, v: number) =>
            `<div>${dot(c)}${label}: <b>${v.toFixed(1)}</b></div>`
          return (
            `<div style="font-weight:600;margin-bottom:4px">${p.date}${
              p.isForecast ? ' - forecast' : ''
            }</div>` +
            (p.isForecast ? '' : rowHtml(tssColor, 'TSS', p.tss)) +
            rowHtml(COLORS.fitness, 'Fitness', p.ctl) +
            rowHtml(COLORS.fatigue, 'Fatigue', p.atl) +
            rowHtml(COLORS.form, 'Form', p.tsb)
          )
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: true,
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: axisColor },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Load / Form',
          nameTextStyle: { color: axisColor },
          axisLabel: { color: axisColor },
          splitLine: { lineStyle: { color: splitColor } },
        },
        {
          type: 'value',
          name: 'TSS',
          min: 0,
          nameTextStyle: { color: axisColor },
          axisLabel: { color: axisColor },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        { type: 'inside', startValue: dates[start], endValue: dates[dates.length - 1] },
        {
          type: 'slider',
          startValue: dates[start],
          endValue: dates[dates.length - 1],
          height: 18,
          bottom: 18,
          borderColor: splitColor,
          fillerColor: dark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.12)',
          textStyle: { color: axisColor },
        },
      ],
      series,
    }
  }, [metrics, visible, dark, timeframe])

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      notMerge
      style={{ height: 460, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      onChartReady={onReady}
    />
  )
}
