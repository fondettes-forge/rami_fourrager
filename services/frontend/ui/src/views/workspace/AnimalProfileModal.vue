<template>
  <v-dialog
    v-model="dialog"
    persistent
    fullscreen
  >
    <v-card>
      <v-card-title>
        <span
          v-if="!copyDisabled"
          class="text-h5"
        >
          {{ $t('workspace.content.datatables.animalProfile.create.dialog.create_title') }}
        </span>
        <span
          v-if="copyDisabled"
          class="text-h5"
        >
          {{ $t('workspace.content.datatables.animalProfile.create.dialog.update_title') }}
        </span>
      </v-card-title>
      <v-form
        ref="animalProfileForm"
        v-model="valid"
        lazy-validation
        @submit.prevent="saveItem"
      >
        <v-card-text>
          <v-row>
            <v-col cols="3">
              <v-sheet
                elevation="2"
                class="pa-6"
              >
                <v-subheader>
                  {{
                    $t('workspace.content.datatables.animalProfile.create.dialog.subheader.copy')
                  }}
                </v-subheader>
                <v-row justify="center">
                  <v-col cols="10">
                    <v-select
                      :items="batchTypeList"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.batchType_select')"
                      item-text="name"
                      item-value="id"
                      return-object
                      :disabled="copyDisabled"
                      @change="handleBTChange"
                    />
                    <v-autocomplete
                      v-model="animalProfileToCopy"
                      :items="animalProfiles"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.animalProfile_to_copy')"
                      item-text="name"
                      item-value="id"
                      dense
                      filled
                      return-object
                      class="autocomplet-transparent-background"
                      :disabled="copyDisabled"
                      clearable
                    />
                  </v-col>
                </v-row>
                <v-row justify="end">
                  <v-btn
                    color="primary"
                    outlined
                    :disabled="copyDisabled"
                    @click="copyAnimalProfile"
                  >
                    {{ $t('btn.copy') }}
                  </v-btn>
                </v-row>
              </v-sheet>
            </v-col>
            <v-col>
              <v-tabs
                centered
                color="primary"
                fixed-tabs
              >
                <v-tab
                  v-for="(tab, tabIndex) in ['infos', 'besoins']"
                  :key="tabIndex"
                >
                  {{ $t('workspace.content.datatables.animalProfile.create.dialog.tabs.' + tab) }}
                </v-tab>
                <v-tab-item>
                  <v-sheet
                    elevation="2"
                    class="pa-6"
                  >
                    <v-select
                      v-model="animalProfile.batch_type"
                      :items="batchTypeList"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.batchType_select')"
                      item-text="name"
                      item-value="id"
                      return-object
                      :disabled="copyDisabled"
                      :rules="[rules.required]"
                      required
                      @change="handleBTChange"
                    />

                    <v-text-field
                      v-model="animalProfile.name"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.name')"
                      :rules="[rules.required]"
                      required
                    />
                    <v-text-field
                      v-model="animalProfile.age_mois"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.age_mois')"
                      :rules="[rules.required]"
                      required
                    />
                    <v-text-field
                      v-model="animalProfile.sem_MB"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.sem_MB')"
                    />
                    <v-text-field
                      v-model.number="animalProfile.weight_MB_kg"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.weight_MB_kg')"
                      dense
                      :rules="[rules.number]"
                      type="number"
                      min="0"
                      hide-spin-buttons
                    />
                    <v-text-field
                      v-model.number="animalProfile.NEC_MB"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.NEC_MB')"
                      dense
                      :rules="[rules.number]"
                      type="number"
                      min="0"
                      hide-spin-buttons
                    />
                    <v-text-field
                      v-model="animalProfile.lactation_duration"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.lactation_duration')"
                    />
                    <v-text-field
                      v-model.number="animalProfile.weight_birth_kg"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.weight_birth_kg')"
                      dense
                      :rules="[rules.number]"
                      type="number"
                      min="0"
                      hide-spin-buttons
                    />
                    <v-text-field
                      v-model.number="animalProfile.milk_product_kg"
                      :label="$t('workspace.content.datatables.animalProfile.create.dialog.milk_product_kg')"
                      dense
                      :rules="[rules.number]"
                      type="number"
                      min="0"
                      hide-spin-buttons
                    />
                  </v-sheet>
                </v-tab-item>
                <v-tab-item>
                  <v-sheet elevation="2">
                    <v-data-table
                      :headers="periodHeaders"
                      :items="animalProfile.animal_profile_periods"
                      item-value="id"
                      class="elevation-1"
                      hide-default-footer
                      dense
                      :options="{ itemsPerPage: 13 }"
                    >
                      <template v-slot:[`item.CI`]="{ item }">
                        <v-text-field
                          v-model.number="item.CI"
                          :label="$t('workspace.content.datatables.animalProfile.create.dialog.CI')"
                          hide-details
                          dense
                          single-line
                          :rules="[rules.number]"
                          type="number"
                          min="0"
                          hide-spin-buttons
                        />
                      </template>

                      <template v-slot:[`item.UFL`]="{ item }">
                        <v-text-field
                          v-model.number="item.UFL"
                          :label="$t('workspace.content.datatables.animalProfile.create.dialog.UFL')"
                          hide-details
                          dense
                          single-line
                          :rules="[rules.number]"
                          type="number"
                          min="0"
                          hide-spin-buttons
                        />
                      </template>

                      <template v-slot:[`item.PDI`]="{ item }">
                        <v-text-field
                          v-model.number="item.PDI"
                          :label="$t('workspace.content.datatables.animalProfile.create.dialog.PDI')"
                          hide-details
                          dense
                          single-line
                          :rules="[rules.number]"
                          type="number"
                          min="0"
                          hide-spin-buttons
                        />
                      </template>

                      <template v-slot:[`item.PL`]="{ item }">
                        <v-text-field
                          v-model.number="item.PL"
                          :label="$t('workspace.content.datatables.animalProfile.create.dialog.PL')"
                          hide-details
                          dense
                          single-line
                          :rules="[rules.number]"
                          type="number"
                          min="0"
                          hide-spin-buttons
                        />
                      </template>
                    </v-data-table>
                  </v-sheet>
                </v-tab-item>
              </v-tabs>
              <!-- <v-divider class="mt-5"></v-divider> -->
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            text
            @click="cancelModal"
          >
            {{ $t('btn.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            type="submit"
            outlined
            :disabled="!valid"
          >
            {{ $t('btn.save') }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
  import { mapGetters } from 'vuex'
  import { deepCopy, transformToAppCode } from '@/plugins/utils'
  // TODO remettre le select de batch_type à blanc pour la création
  // attention lorsque je modifie le type d'animaux, le select se recharge avec les profiles correspondants
  // un problème de réfraichissement de la liste des profiles
  export default {
    name: 'AnimalProfileModal',
    props: {
      item: {
        type: null,
        required: true,
      },
      dialog: Boolean,
    },
    data() {
      return {
        animalProfileToCopy: null,
        animalProfiles: [],
        copyDisabled: false,
        animalProfile: {},
        periodHeaders: [
          {
            text: this.$t('workspace.content.datatables.animalProfile.create.dialog.period'),
            value: 'period_id',
            align: 'start',
          },
          {
            text: this.$t('workspace.content.datatables.animalProfile.create.dialog.CI'),
            value: 'CI',
          },
          {
            text: this.$t('workspace.content.datatables.animalProfile.create.dialog.UFL'),
            value: 'UFL',
          },
          {
            text: this.$t('workspace.content.datatables.animalProfile.create.dialog.PDI'),
            value: 'PDI',
          },
          {
            text: this.$t('workspace.content.datatables.animalProfile.create.dialog.PL'),
            value: 'PL',
          },
        ],
        valid: true,
        rules: {
          required: (value) => !!value || this.$t('validation.required'),
          number: (value) => (!isNaN(value) && isFinite(value)) || this.$t('validation.number'),
        },
      }
    },
    watch: {
      item: {
        immediate: true,
        handler(newValue, oldValue) {
          if (newValue != null) {
            // update
            this.animalProfile = newValue
            this.copyDisabled = true
          } else {
            // create — batch_type à blanc (ticket 15 A)
            this.animalProfile = {
              batch_type_id: null,
              batch_type: null,
              code: '',
              name: '',
              period_MB: 'printemps',
              age_mois: '',
              sem_MB: '',
              weight_MB_kg: 0,
              NEC_MB: 0,
              lactation_duration: '',
              weight_birth_kg: 0,
              milk_product_kg: 0,
              TR: 0,
              animal_profile_periods: Array.from({ length: 13 }, (v, k) => ({
                period_id: k + 1,
                CI: 0,
                UFL: 0,
                PDI: 0,
                PL: 0,
              })),
            }
            this.animalProfiles = []
            this.copyDisabled = false
          }
        },
      },
    },
    computed: {
      ...mapGetters('referential', {
        getAnimalProfileList: 'animalProfileList',
        batchTypeList: 'batchTypeList',
        getBatchType: 'getBatchTypeById',
      }),

      batchType: {
        get() {
          if (this.copyDisabled) {
            const s = this.getBatchType(this.animalProfile.batch_type_id)
            return s
          }
          return {}
        },
        set(val) {},
      },
    },
    methods: {
      copyAnimalProfile() {
        this.animalProfile = deepCopy(this.animalProfileToCopy)
      },

      cancelModal() {
        this.clearItem()
        this.$emit('cancel-modal', 'animalProfile')
      },
      clearItem() {
        this.$refs.animalProfileForm.reset()
        this.animalProfile = {}
      },
      saveItem() {
        if (this.$refs.animalProfileForm.validate()) {
          if (this.animalProfile.id) {
            delete this.animalProfile.id
          }
          this.animalProfile.code = transformToAppCode(this.animalProfile.name)
          this.$emit('add-item', { dialogName: 'animalProfile', item: deepCopy(this.animalProfile) })
          this.clearItem()
        } else {
          return false
        }
      },
      handleBTChange(val) {
        // ticket 15 B : recharger la liste des profils + vider le profil sélectionné
        this.animalProfiles = this.getAnimalProfileList(val.id)
        this.animalProfile.batch_type_id = val.id
        this.animalProfile.batch_type = val
        this.animalProfileToCopy = null // vider le profil copié
      },
    },
  }
</script>

<style scoped>
  .v-text-field {
    margin-bottom: 16px;
  }
</style>
