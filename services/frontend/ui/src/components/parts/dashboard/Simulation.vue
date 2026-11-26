<template>
  <base-dashboard-card
    :title="$t('dashboard.simulation.title')"
    card-color="#4caf5073"
    title-color="transparent"
    :dark="true"
    icon="mdi-head-cog-outline"
    :with-subtitle="true"
    :description="$t('dashboard.simulation.description', { desc: simulation.description })"
  >
    <template
      v-if="simulation.name"
      v-slot:subtitle
    >
      {{ $t('dashboard.simulation.name', { name: simulation.name }) }}
    </template>
  </base-dashboard-card>
</template>
<script>
  import { mapState } from 'vuex'
  export default {
    name: 'SimulationCard',
    computed: {
      ...mapState('simulator', {
        simulation: (state) => state,
      }),
    },
  }
</script>
