<template>
  <div>
    <v-row
      v-for="(batch, index) in batchs"
      :key="index"
    >
      <v-col cols="12">
        <div class="text-h4 indigo--text font-italic">
          {{
            $t('herd.print.feeds.title', {
              selectedLot: index + 1,
              count: batch.count,
              profile: batch.profile.name,
            })
          }}
        </div>
        <div style="padding-left: 75px">
          <graph-feeds-requirements
            :id="`graph-feeds-requirements-${index}`"
            :selected-lot="index"
            :with-yaxis="true"
            :with-legend="false"
            :with-title="false"
            :with-tool-box="false"
            :with-tooltip="false"
            :x-axis-label-rotate="true"
          />
        </div>
        <v-divider />
      </v-col>
    </v-row>
  </div>
</template>
<script>
  import { mapState } from 'vuex'
  import GraphFeedsRequirements from '@/components/parts/herd/GraphFeedsRequirements.vue'

  export default {
    name: 'HerdPrintArea',
    components: {
      GraphFeedsRequirements,
    },
    computed: {
      ...mapState('simulator/herd', {
        batchs: (state) => state.batchs,
      }),
    },
  }
</script>
