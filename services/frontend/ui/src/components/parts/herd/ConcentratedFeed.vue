<template>
  <div>
    <base-period-layout
      :page-color="pageColor"
      tool-bar-title-key="herd.concentratedfeed.tabs.table.title"
      @selected="periodSelected"
      @duplicate="duplicate"
      @add-modal="openModal(selectedPeriodIndex)"
    >
      <template v-slot:graph>
        <graph-coverage
          :selected-lot="selectedLot"
          :selection="selectedPeriodIndex"
          :stand-alone="false"
          :small="true"
          :title="$t('herd.concentratedfeed.graph.title')"
        />
      </template>
      <template v-slot:tab-item>
        <v-data-table
          :headers="headers"
          :items="feeds"
          class="elevation-1"
          sort-by="type"
          hide-default-footer
        >
          <template v-slot:[`item.type.name`]="{ item }">
            <base-metadata-tooltip
              :description="item.type.description"
              :source="item.type.source || item.type.nutritional_values?.source"
              :updated-at="item.type.updated_at"
            >
              {{ item.type.name }}
            </base-metadata-tooltip>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon
              small
              @click="deleteItem(item)"
            >
              mdi-delete
            </v-icon>
            <v-icon
              medium
              color="green"
              background-color="green"
              @click="editItem(item)"
            >
              mdi-square-edit-outline
            </v-icon>
          </template>
        </v-data-table>
      </template>
    </base-period-layout>
    <concentrated-feed-modal
      :page-color="pageColor"
      :item="feedItem"
      :force-open="dialogs[selectedPeriodIndex]"
      :selected-period-index="selectedPeriodIndex"
      @add-item="saveItem"
      @cancel-modal="closeModal"
    />
  </div>
</template>
<script>
  import { mapGetters } from 'vuex'
  import ConcentratedFeedModal from './ConcentratedFeedModal.vue'
  import GraphCoverage from './GraphCoverage.vue'

  export default {
    name: 'ConcentratedFeed',
    components: {
      ConcentratedFeedModal,
      GraphCoverage,
    },

    props: {
      selectedLot: {
        type: null,
        required: true,
      },
      pageColor: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        headers: [
          { text: this.$t('herd.concentratedfeed.tabs.table.name'), value: 'type.name' },
          { text: this.$t('herd.concentratedfeed.tabs.table.quantity'), value: 'quantity' },
          { text: this.$t('herd.concentratedfeed.tabs.table.actions'), value: 'actions', sortable: false },
        ],
        batch: null,
        feedItem: null,
        oldFeedItem: null,
        // pour les modals des periodes
        dialogs: Array.from({ length: 13 }, () => false),
        selectedPeriodIndex: 0,
      }
    },
    beforeMount() {
      this.batch = this.getBatch(this.selectedLot)
    },
    computed: {
      ...mapGetters('simulator/herd', {
        getBatch: 'getBatch',
      }),
      // ...mapGetters('simulator', {
      //   getConcentratedFeed: 'getConcentratedFeedByPeriod',
      // }),
      ...mapGetters('referential', { periods: 'periodList' }),
      feeds: {
        get() {
          return this.getBatch(this.selectedLot).concentratedFeeds[this.selectedPeriodIndex].feeds
        },
      },
    },
    methods: {
      // modals
      openModal(index) {
        this.$set(this.dialogs, index, true)
      },
      closeModal(index) {
        this.feedItem = null
        this.oldFeedItem = null
        this.$set(this.dialogs, index, false)
      },

      editItem(item) {
        // Ouvrir la modal de création/modification de la ration Concentrated Feeds
        this.feedItem = { ...item }
        this.oldFeedItem = { ...item }
        this.openModal(this.selectedPeriodIndex)
      },
      saveItem(item) {
        if (this.oldFeedItem !== null) {
          // Modification
          this.$store.commit('simulator/herd/updateConcentratedFeed', {
            batchId: this.selectedLot,
            periodId: this.selectedPeriodIndex,
            newFeed: item,
            oldFeed: this.oldFeedItem,
          })
        } else {
          // Ajout
          this.$store.commit('simulator/herd/createConcentratedFeed', {
            batchId: this.selectedLot,
            periodId: this.selectedPeriodIndex,
            newFeed: item,
          })
        }
        this.closeModal(this.selectedPeriodIndex)
      },
      duplicate({ source, targets }) {
        this.$store.commit('simulator/herd/duplicateConcentratedFeedsByPeriod', {
          batchId: this.selectedLot,
          source: source,
          targets: targets,
        })
      },
      deleteItem(item) {
        if (confirm(this.$t('notifications.confirm_delete_item'))) {
          this.$store.commit('simulator/herd/deleteConcentratedFeed', {
            batchId: this.selectedLot,
            periodId: this.selectedPeriodIndex,
            feed: item,
          })
        }
      },
      periodSelected(period) {
        this.selectedPeriodIndex = period
      },
    },
  }
</script>
