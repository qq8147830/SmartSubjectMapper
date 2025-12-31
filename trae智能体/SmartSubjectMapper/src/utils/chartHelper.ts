import * as echarts from 'echarts'

export interface ChartOptions {
  title?: string
  type: 'radar' | 'bar' | 'line' | 'pie'
  data: any[]
  options?: any
}

export function createChart(container: HTMLElement, options: ChartOptions) {
  const chart = echarts.init(container)
  
  let chartOption: any = {}
  
  switch (options.type) {
    case 'radar':
      chartOption = {
        title: { text: options.title, left: 'center' },
        radar: {
          indicator: options.data,
          radius: '60%'
        },
        series: [{
          type: 'radar',
          data: [{ value: options.data.map((item: any) => item.value) }]
        }]
      }
      break
      
    case 'bar':
      chartOption = {
        title: { text: options.title, left: 'center' },
        xAxis: { type: 'category', data: options.data.map((item: any) => item.name) },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: options.data.map((item: any) => item.value),
          itemStyle: { color: '#5470c6' }
        }]
      }
      break
  }
  
  chart.setOption(chartOption)
  return chart
}

export function resizeChart(chart: any) {
  chart.resize()
}