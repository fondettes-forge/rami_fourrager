<template>
  <div>
    <v-col cols="12">
      <v-tabs
        centered
        color="primary"
        fixed-tabs
      >
        <v-tab
          v-for="(tab, tabIndex) in ['simulation', 'animalProfile', 'stic', 'feed', 'export']"
          :key="tabIndex"
          class="text-h6"
          @click="$store.dispatch('workspace/deactivateAllMapping')"
        >
          {{ $t('workspace.content.tabs.' + tab) }}
        </v-tab>
        <!-- <div>datatable des simulations du workpsace -->
        <v-tab-item>
          <v-data-table
            :items="workspace.simulations"
            :headers="simulationHeaders"
            fixed-header
            :options="dataTableOptions"
          >
            <template v-slot:top>
              <v-toolbar
                color="white"
                flat
              >
                <v-toolbar-title />
                <v-divider
                  class="mx-4"
                  inset
                  vertical
                />
                <v-spacer />
                <v-btn
                  outlined
                  color="primary"
                  class="text-h6"
                  @click="dialogs.simulation = true"
                >
                  {{ $t('workspace.content.datatables.simulation.create.btn') }}
                </v-btn>
                <simulation-modal
                  :dialog.sync="dialogs.simulation"
                  :item="newItems.simulation"
                  @add-item="saveItem"
                  @cancel-modal="closeModal"
                />
                <simulation-duplicate-modal
                  :dialog.sync="dialogs.duplicateSimulation"
                  :item="duplicateItemSource"
                  @add-item="duplicateSimulation"
                  @cancel-modal="closeModal"
                />
              </v-toolbar>
            </template>
            <template v-slot:item="{ item }">
              <tr :class="item.loaded ? 'primary white--text' : ''">
                <!-- Apply green color if loaded -->
                <td>
                  {{ item.name }}
                  <!-- Replace with appropriate data -->
                </td>
                <td>
                  {{ item.description }}
                  <!-- Replace with appropriate data -->
                </td>
                <td>
                  {{ item.lastModifiedDate }}
                  <!-- Replace with appropriate data -->
                </td>
                <td>
                  <v-tooltip
                    v-if="!item.loaded"
                    left
                    open-delay="500"
                    color="grey"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        small
                        outlined
                        color="primary"
                        v-bind="attrs"
                        @click="loadSimulation(item)"
                        v-on="on"
                      >
                        {{ $t('workspace.content.datatables.simulation.actions.load_btn') }}
                      </v-btn>
                    </template>
                    <span>{{ $t('workspace.content.datatables.simulation.actions.load_description') }}</span>
                  </v-tooltip>

                  <v-icon
                    medium
                    color="green"
                    background-color="green"
                    @click="editItem('simulation', item)"
                  >
                    mdi-square-edit-outline
                  </v-icon>
                  <v-icon
                    medium
                    color="grey"
                    @click="duplicateItem(item)"
                  >
                    mdi-content-copy
                  </v-icon>
                  <v-icon
                    v-if="!item.loaded"
                    small
                    @click="deleteSimulation(item)"
                  >
                    mdi-delete
                  </v-icon>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-tab-item>
        <!-- <div>datatable des animalProfiles du workpsace avec un bouton exporter pour exporter la liste -->
        <v-tab-item>
          <v-data-table
            :items="workspace.animalProfiles"
            :headers="animalProfileHeaders"
            fixed-header
            :options="dataTableOptions"
          >
            <template v-slot:top>
              <v-toolbar
                color="white"
                flat
              >
                <v-toolbar-title />
                <v-divider
                  class="mx-4"
                  inset
                  vertical
                />
                <v-spacer />
                <v-btn
                  outlined
                  color="primary"
                  class="text-h6"
                  @click="dialogs.animalProfile = true"
                >
                  {{ $t('workspace.content.datatables.animalProfile.create.btn') }}
                </v-btn>
                <animal-profile-modal
                  :dialog.sync="dialogs.animalProfile"
                  :item="newItems.animalProfile"
                  @add-item="saveItem"
                  @cancel-modal="closeModal"
                />
              </v-toolbar>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-icon
                small
                @click="deleteItem('animalProfile', item)"
              >
                mdi-delete
              </v-icon>
              <v-icon
                medium
                color="green"
                background-color="green"
                @click="editItem('animalProfile', item)"
              >
                mdi-square-edit-outline
              </v-icon>
            </template>
          </v-data-table>
        </v-tab-item>
        <!-- <div>datatable des stics du workpsace avec un bouton exporter pour exporter la liste -->
        <v-tab-item>
          <v-data-table
            :items="workspace.stics"
            :headers="sticHeaders"
            fixed-header
            :options="dataTableOptions"
          >
            <template v-slot:top>
              <v-toolbar
                color="white"
                flat
              >
                <v-toolbar-title />
                <v-divider
                  class="mx-4"
                  inset
                  vertical
                />
                <v-spacer />
                <v-btn
                  outlined
                  color="primary"
                  class="text-h6"
                  @click="dialogs.stic = true"
                >
                  {{ $t('workspace.content.datatables.stic.create.btn') }}
                </v-btn>
                <stic-modal
                  :dialog.sync="dialogs.stic"
                  :item="newItems.stic"
                  @add-item="saveItem"
                  @cancel-modal="closeModal"
                />
              </v-toolbar>
            </template>
            <template v-slot:item="{ item }">
              <tr>
                <!-- Apply green color if loaded -->
                <td>
                  {{ getSite(item.climatic_year_id).name }}
                  <!-- Replace with appropriate data -->
                </td>
                <td>
                  {{ getClimaticYearById(item.climatic_year_id).name }}
                  <!-- Replace with appropriate data -->
                </td>
                <td>
                  <base-metadata-tooltip
                    :description="item.resume"
                    :source="item.source"
                    :updated-at="item.updated_at"
                  >
                    {{ item.name }}
                  </base-metadata-tooltip>
                </td>
                <td>
                  {{ item.source }}
                  <!-- Source de la baguette (ticket 22) -->
                </td>
                <td>
                  <!-- <template v-slot:[`item.actions`]="{ item }"> -->
                  <v-icon
                    small
                    @click="deleteItem('stic', item)"
                  >
                    mdi-delete
                  </v-icon>
                  <v-icon
                    medium
                    color="green"
                    background-color="green"
                    @click="editItem('stic', item)"
                  >
                    mdi-square-edit-outline
                  </v-icon>
                  <!-- </template> -->
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-tab-item>
        <!-- <div>datatable des feeds du workpsace avec un bouton exporter pour exporter la liste -->
        <v-tab-item>
          <v-data-table
            :items="workspace.classicFeeds"
            :headers="feedHeaders"
          >
            <template v-slot:top>
              <v-toolbar
                color="white"
                flat
              >
                <v-toolbar-title />
                <v-divider
                  class="mx-4"
                  inset
                  vertical
                />
                <v-spacer />
                <classic-feed-modal
                  :force-open="dialogs.classicFeed"
                  :item="newItems.classicFeed"
                  @add-item="saveItem"
                  @cancel-modal="closeModal"
                />
              </v-toolbar>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-icon
                small
                class="mr-2"
                @click="copyItem('classicFeed', item)"
              >
                mdi-content-copy
              </v-icon>
              <v-icon
                small
                class="mr-2"
                @click="deleteItem('classicFeed', item)"
              >
                mdi-delete
              </v-icon>
              <v-icon
                medium
                color="green"
                background-color="green"
                @click="editItem('classicFeed', item)"
              >
                mdi-square-edit-outline
              </v-icon>
            </template>
          </v-data-table>
        </v-tab-item>
        <v-tab-item>
          <export />
        </v-tab-item>
      </v-tabs>
    </v-col>
  </div>
</template>
<script>
  import { mapState, mapGetters, mapActions } from 'vuex'
  import { deepCopy } from '@/plugins/utils'
  import ClassicFeedModal from './ClassicFeedModal.vue'
  import SticModal from './SticModal.vue'
  import SimulationModal from './SimulationModal.vue'
  import SimulationDuplicateModal from './SimulationDuplicateModal.vue'
  import AnimalProfileModal from './AnimalProfileModal.vue'
  import Export from './Export.vue'

  export default {
    name: 'WorkspaceContent',
    components: {
      ClassicFeedModal,
      SticModal,
      SimulationModal,
      SimulationDuplicateModal,
      AnimalProfileModal,
      Export,
    },
    data() {
      return {
        dialogs: {
          simulation: false,
          duplicateSimulation: false,
          classicFeed: false,
          stic: false,
          animalProfile: false,
        },
        newItems: {
          simulation: null,
          classicFeed: null,
          stic: null,
          animalProfile: null,
        },
        oldItems: {
          simulation: null,
          classicFeed: null,
          stic: null,
          animalProfile: null,
        },
        // ticket 21 — simulation source à dupliquer
        duplicateItemSource: null,
        rules: {
          required: (val) => !!val || 'Ce champ est requis',
          integer: (val) => /^\d+$/.test(val) || 'Ce champ doit être un entier',
        },
      }
    },
    computed: {
      ...mapState('simulator/farm', {
        farm: (state) => state,
      }),
      ...mapState('simulator/barn', {
        barn: (state) => state,
      }),
      ...mapState('simulator/herd', {
        herd: (state) => state,
      }),
      ...mapGetters('workspace', {
        getWorkspace: 'getWorkspace',
        getActivatedSimulation: 'getActivatedSimulation',
      }),
      ...mapGetters('referential', {
        getSite: 'getSiteByClimaticYearId',
        getClimaticYearById: 'getClimaticYearById',
      }),

      workspace: {
        get() {
          return this.getWorkspace
        },
      },
      dataTableOptions() {
        return {
          itemsPerPage: 4,
        }
      },
      simulationHeaders() {
        return [
          { text: this.$t('workspace.content.datatables.simulation.header.name'), value: 'name' },
          { text: this.$t('workspace.content.datatables.simulation.header.description'), value: 'description' },
          {
            text: this.$t('workspace.content.datatables.simulation.header.lastModifiedDate'),
            value: 'lastModifiedDate',
            dataType: 'Date',
          },
          {
            text: this.$t('workspace.content.datatables.simulation.header.actions'),
            value: 'actions',
            sortable: false,
          },
        ]
      },
      animalProfileHeaders() {
        return [
          { text: this.$t('workspace.content.datatables.animalProfile.header.batchtype'), value: 'batch_type.name' },
          { text: this.$t('workspace.content.datatables.animalProfile.header.name'), value: 'name' },
          {
            text: this.$t('workspace.content.datatables.animalProfile.header.actions'),
            value: 'actions',
            sortable: false,
          },
        ]
      },
      sticHeaders() {
        return [
          { text: this.$t('workspace.content.datatables.stic.header.site'), value: 'site' },
          { text: this.$t('workspace.content.datatables.stic.header.climatic_year'), value: 'climaticYear' },
          { text: this.$t('workspace.content.datatables.stic.header.name'), value: 'name' },
          { text: this.$t('workspace.content.datatables.stic.header.source'), value: 'source' },
          { text: this.$t('workspace.content.datatables.stic.header.actions'), value: 'actions', sortable: false },
        ]
      },
      feedHeaders() {
        return [
          { text: this.$t('workspace.content.datatables.classicFeed.header.name'), value: 'name' },
          {
            text: this.$t('workspace.content.datatables.classicFeed.header.correspondingStock'),
            value: 'correspondingStock',
          },
          {
            text: this.$t('workspace.content.datatables.classicFeed.header.actions'),
            value: 'actions',
            sortable: false,
          },
        ]
      },
    },
    created() {
      const sim = this.getActivatedSimulation
      if (sim) {
        this.loadSimulation(sim)
      }
    },
    methods: {
      ...mapActions('workspace', { loadSimulator: 'loadSimulator' }),

      loadSimulation(simulation) {
        this.loadSimulator(simulation)
        try {
          this.$store.dispatch('simulator/farm/setTotalAvailablePastureByPeriod', null, { root: true })
        } catch (error) {
          this.$toast({
            message: this.$t('notifications.stic.errors.getStic'),
            type: 'error', // 'info', 'warning', 'error'
            icon: 'mdi-check-circle', // any Vuetify icon
            timeout: 5000, // optional, defaults to 5000
          })
        }
        try {
          this.$store.dispatch('simulator/farm/dispatchProduction', null, { root: true })
        } catch (error) {
          this.$toast({
            message: this.$t('notifications.stic.errors.getStic'),
            type: 'error', // 'info', 'warning', 'error'
            icon: 'mdi-check-circle', // any Vuetify icon
            timeout: 5000, // optional, defaults to 5000
          })
        }
        this.$toast({
          message: this.$t('notifications.simulation_loaded_success'),
          type: 'success',
          timeout: 3000,
        })
        // this.$router.push('/simulation')
      },
      deleteSimulation(simulation) {
        if (confirm(this.$t('notifications.confirm_delete_item'))) {
          this.$store.commit('workspace/deleteSimulation', simulation)
          this.$toast({
            message: this.$t('workspace.content.datatables.simulation.delete_success'),
            type: 'success',
            timeout: 3000,
          })
        }
      },
      // ticket 21 — dupliquer une simulation (« enregistrer-sous »)
      duplicateItem(simulation) {
        this.duplicateItemSource = simulation
        this.dialogs.duplicateSimulation = true
      },
      duplicateSimulation({ item, name }) {
        this.$store.commit('workspace/duplicateSimulation', { simulation: item, name })
        this.duplicateItemSource = null
      },
      exportSimulation(simulation) {
        const data = {
          name: simulation.name,
          description: simulation.description,
          lastUpdate: simulation.lastUpdate,
        }
        const jsonData = JSON.stringify(data)

        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = 'simulation.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      },

      closeModal(dialogName) {
        this.dialogs[dialogName] = false
        this.oldItems[dialogName] = null
        this.newItems[dialogName] = null
      },

      // datatables
      saveItem({ dialogName, item }) {
        if (this.oldItems[dialogName] !== null && this.oldItems[dialogName] !== undefined) {
          // Modification
          this.$store.commit('workspace/updateItem', {
            dialog: dialogName,
            newItem: deepCopy(item),
            oldItem: deepCopy(this.oldItems[dialogName]),
          })
        } else {
          // Ajout
          this.$store.commit('workspace/addItem', {
            dialog: dialogName,
            newItem: deepCopy(item),
          })
        }
        this.closeModal(dialogName)
        // this.newItems[dialogName] = null
        // this.oldItems[dialogName] = null
      },

      editItem(dialogName, item) {
        this.oldItems[dialogName] = deepCopy(item)
        this.newItems[dialogName] = deepCopy(item)
        this.dialogs[dialogName] = true
      },

      copyItem(dialogName, item) {
        // Mode création (oldItems = null) + pré-remplissage avec les valeurs de la carte source
        this.oldItems[dialogName] = null
        const copy = deepCopy(item)
        // Dérive le nom pour que l'utilisateur le renomme (sans copier l'id)
        copy.name = item.name + ' (copie)'
        // Supprime l'id pour qu'il soit recalculé à la volée (ticket 1 §2.4)
        if (copy.id !== undefined) {
          delete copy.id
        }
        this.newItems[dialogName] = copy
        this.dialogs[dialogName] = true
      },

      deleteItem(dialogName, item) {
        if (confirm(this.$t('notifications.confirm_delete_item'))) {
          this.$store.commit('workspace/deleteItem', { dialog: dialogName, item: deepCopy(item) })
        }
      },
    },
  }
</script>
