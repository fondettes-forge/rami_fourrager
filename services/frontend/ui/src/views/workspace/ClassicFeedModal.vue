<template>
  <div>
    <v-dialog
      v-model="showModal"
      max-width="600px"
      persistent
      no-click-animation
    >
      <template v-slot:activator="{ on }">
        <v-btn
          color="green"
          outlined
          v-on="on"
        >
          {{ $t('workspace.content.datatables.classicFeed.create.btn') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="text-h5"> {{ $t('workspace.content.datatables.classicFeed.create.dialog.title') }} </span>
        </v-card-title>

        <!-- <v-card-text>
          <v-container>
            <v-row>
              <v-col
                cols="12"
                md="6"
                sm="12"
              > -->

        <v-form
          ref="workspaceClassicFeedForm"
          v-model="valid"
          lazy-validation
          @submit.prevent="saveItem"
        >
          <v-card-text>
            <v-text-field
              v-model="feedItem.name"
              :rules="[rules.required]"
              :label="$t('workspace.content.datatables.classicFeed.create.dialog.name')"
              required
            />

            <v-select
              v-model="feedItem.correspondingStock"
              :items="barnStockItems"
              item-text="name"
              item-value="code"
              :label="$t('workspace.content.datatables.classicFeed.create.dialog.correspondingStock')"
              :rules="[rules.required, rules.validStock]"
              :no-data-text="$t('validation.noData')"
            />

            <v-subheader>
              {{
                $t('workspace.content.datatables.classicFeed.create.dialog.nutritional_values')
              }}
            </v-subheader>

            <v-row>
              <v-col
                v-for="(value, key) in feedItem.nutritional_values"
                :key="key"
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="feedItem.nutritional_values[key]"
                  :label="key"
                  :rules="[rules.number]"
                  type="number"
                  min="0"
                  hide-spin-buttons
                />
              </v-col>
            </v-row>
          </v-card-text>
          <!-- </v-col>
            </v-row>
          </v-container>
        </v-card-text> -->

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="grey"
              text
              @click="cancelModal"
            >
              {{ $t('workspace.content.datatables.classicFeed.create.dialog.btn_cancel') }}
            </v-btn>
            <v-btn
              color="primary"
              type="submit"
              outlined
              :disabled="!valid"
            >
              {{ $t('workspace.content.datatables.classicFeed.create.dialog.btn_create') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
  import { mapGetters } from 'vuex'

  export default {
    name: 'ClassicFeedModal',
    props: {
      item: {
        type: null,
        required: true,
      },
      forceOpen: {
        type: Boolean,
        required: true,
      },
    },
    data() {
      return {
        showModal: false,
        valid: true,
        feedItem: null,
        rules: {
          required: (value) => !!value || this.$t('validation.required'),
          number: (value) => (!isNaN(value) && isFinite(value)) || this.$t('validation.number'),
          validStock: (value) =>
            !value || this.barnStockItems.some((stock) => stock.code === value) || this.$t('validation.validStock'),
        },
      }
    },
    watch: {
      item: {
        immediate: true,
        handler(newValue, oldValue) {
          if (newValue != null) {
            this.feedItem = newValue
          } else {
            this.feedItem = {
              name: '',
              correspondingStock: '',
              nutritional_values: {
                UEL: 0,
                UEB: 0,
                UEM: 0,
                UFL: 0,
                PDI_inf: 0,
                UFV: 0,
                PDIN: 0,
                PDIE: 0,
                rejection: 0,
              },
            }
          }
        },
      },
      forceOpen: {
        immediate: true,
        handler(newValue, oldvalue) {
          if (newValue === true) {
            this.showModal = true
          }
        },
      },
    },
    computed: {
      ...mapGetters('referential', {
        barnStockItems: 'barnStockItemList',
      }),
    },
    methods: {
      cancelModal() {
        this.showModal = false
        this.clearFeedItem()
        this.$emit('cancel-modal', 'classicFeed')
      },
      clearFeedItem() {
        this.feedItem = {
          name: '',
          correspondingStock: '',
          nutritional_values: {
            UEL: 0,
            UEB: 0,
            UEM: 0,
            UFL: 0,
            PDI_inf: 0,
            UFV: 0,
            PDIN: 0,
            PDIE: 0,
            rejection: 0,
          },
        }
        this.oldFeedItem = null
        this.$refs.workspaceClassicFeedForm.resetValidation()
      },
      saveItem() {
        if (this.$refs.workspaceClassicFeedForm.validate()) {
          this.$emit('add-item', { dialogName: 'classicFeed', item: this.feedItem })
          this.showModal = false
          this.clearFeedItem()
        } else {
          return false
        }
      },
    },
  }
</script>
