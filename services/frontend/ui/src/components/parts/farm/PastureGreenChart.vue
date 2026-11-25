<template>
  <div class="pb-2">
    <div class="text-subtitle-1 font-weight-medium mb-2">
      {{ $t('farm.pastureGreenChart.title') }}
    </div>
    <div v-if="hasData" ref="pastureGreenChartContainer" class="pasture-green-chart-container" style="width: 100%; height: 250px">
      <v-chart
        class="pasture-green-chart"
        :option="options"
        autoresize
        theme="infographic"
        :init-options="initOptions"
      />
    </div>
    <div v-else class="pa-4 text-center grey--text">
      {{ $t('farm.pastureGreenChart.empty') }}
    </div>
  </div>
</template>
<script>
  import { mapGetters } from 'vuex'

  export default {
    name: 'PastureGreenChart',
    props: {
      climaticYear: { type: Number, default: null },
    },
    data() {
      return {
        periods: [
          this.$t('periods.graph.P1'),
          this.$t('periods.graph.P2'),
          this.$t('periods.graph.P3'),
          this.$t('periods.graph.P4'),
          this.$t('periods.graph.P5'),
          this.$t('periods.graph.P6'),
          this.$t('periods.graph.P7'),
          this.$t('periods.graph.P8'),
          this.$t('periods.graph.P9'),
          this.$t('periods.graph.P10'),
          this.$t('periods.graph.P11'),
          this.$t('periods.graph.P12'),
          this.$t('periods.graph.end'),
        ],
      }
    },
    computed: {
      ...mapGetters('simulator/farm', {
        comparison: 'getPastureGreenComparison',
      }),
      hasData() {
        return this.comparison && this.comparison.disponible.length > 0
      },
      initOptions() {
        return { width: 'auto', height: 'auto' }
      },
      options() {
        const { disponible, besoin } = this.comparison
        return {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
              const lines = params.map(
                (p) => `${p.seriesName} : <b>${p.value} ${this.$t('farm.pastureGreenChart.unity')}</b>`
              )
              return `${params[0].axisValue}<br/>` + lines.join('<br/>')
            },
          },
          legend: {
            data: [this.$t('farm.pastureGreenChart.available'), this.$t('farm.pastureGreenChart.need')],
          },
          grid: {
            left: '5%',
            right: '5%',
            bottom: '15%',
            top: '20%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            data: this.periods,
            axisLabel: {
              interval: 0,
              rotate: '45',
            },
          },
          yAxis: {
            type: 'value',
            name: this.$t('farm.pastureGreenChart.unity'),
          },
          series: [
            {
              name: this.$t('farm.pastureGreenChart.available'),
              type: 'bar',
              data: disponible,
              itemStyle: { color: '#265728' },
            },
            {
              name: this.$t('farm.pastureGreenChart.need'),
              type: 'bar',
              data: besoin,
              itemStyle: { color: '#D2EAD3' },
            },
          ],
        }
      },
    },
  }
</script>
<style>
  .pasture-green-chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }
</style>
