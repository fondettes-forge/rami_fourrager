<template>
  <div>
    <v-dialog
      v-model="showModal"
      persistent
      no-click-animation
      fullscreen
    >
      <template v-slot:activator="{ on }">
        <v-btn
          color="green"
          outlined
          v-on="on"
        >
          {{ $t('workspace.content.datatables.mapping.create.btn') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="text-h5"> {{ $t('workspace.content.datatables.mapping.create.dialog.title') }} </span>
        </v-card-title>
        <v-form
          ref="workspaceMappingForm"
          v-model="valid"
          lazy-validation
          @submit.prevent="saveItem"
        >
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="4">
                  <v-text-field
                    v-model="mappingItem.name"
                    :label="$t('workspace.content.datatables.mapping.create.name')"
                    :rules="[rules.required]"
                    required
                  />
                  <v-divider class="my-3" />
                  <v-sheet
                    elevation="2"
                    class="pa-6"
                  >
                    <v-subheader> {{ $t('workspace.content.datatables.mapping.create.field.subheader') }} </v-subheader>
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="newField.key"
                          :label="$t('workspace.content.datatables.mapping.create.field.key')"
                          required
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-select
                          v-model="newField.value"
                          :items="fieldList"
                          item-value="calc"
                          item-text="label"
                          return-object
                          :label="$t('workspace.content.datatables.mapping.create.field.value_to_get')"
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        class="text-right"
                      >
                        <v-btn
                          color="primary"
                          :disabled="!newField.key"
                          @click="addField"
                        >
                          {{ $t('workspace.content.datatables.mapping.create.field.btn_add') }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-sheet>
                </v-col>
                <v-col cols="8">
                  <v-data-table
                    :headers="headers"
                    :items="mappingItem.fields"
                    dense
                  >
                    <template v-slot:item.index="{ index }">
                      {{ index + 1 }}
                    </template>
                    <template v-slot:item.key="{ item }">
                      <v-text-field
                        v-model="item.key"
                        :rules="[rules.required]"
                        required
                      />
                    </template>
                    <template v-slot:item.value="{ item }">
                      <v-select
                        v-model="item.value"
                        :items="simulationFields"
                        required
                      />
                    </template>
                    <template v-slot:item.actions="{ index }">
                      <v-btn icon>
                        <v-icon
                          small
                          @click="removeField(index)"
                        >
                          mdi-delete
                        </v-icon>
                      </v-btn>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>
            </v-container>
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
              :disabled="!mappingItem.name || mappingItem.fields.length === 0"
            >
              {{ $t('btn.save') }}
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
    name: 'MappingModal',
    props: {
      item: { type: null, required: true },
      forceOpen: { type: Boolean, required: true },
    },
    data() {
      return {
        showModal: false,
        valid: true,
        newField: { key: '', value: '' },
        mappingItem: {
          name: '',
          protected: false,
          inUse: false,
          fields: [],
        },
        rules: {
          required: (value) => !!value || this.$t('validation.required'),
        },
        headers: [
          { text: this.$t('workspace.content.datatables.mapping.create.list.column'), value: 'index', sortable: false },
          { text: this.$t('workspace.content.datatables.mapping.create.list.key'), value: 'key' },
          { text: this.$t('workspace.content.datatables.mapping.create.list.value'), value: 'value.label' },
          { text: '', value: 'actions', sortable: false },
        ],
      }
    },
    computed: {
      ...mapGetters('referential', { barnStockItems: 'barnStockItemList' }),
      ...mapGetters('workspace/mapper', {
        availableCalculationFields: 'availableCalculationFields',
      }),
      fieldList() {
        const toto = this.availableCalculationFields.map((item) => {
          return {
            label: this.$t(`export.calculations.${item}`) || item,
            calc: item,
          }
        })
        return toto
      },
    },
    watch: {
      item: {
        immediate: true,
        handler(newValue) {
          this.mappingItem = newValue ? { ...newValue } : { name: '', protected: false, inUse: false, fields: [] }
        },
      },
      forceOpen: {
        immediate: true,
        handler(newValue) {
          if (newValue) this.showModal = true
        },
      },
    },
    methods: {
      cancelModal() {
        this.showModal = false
        this.clearItem()
        this.$emit('cancel-modal', 'mapping')
      },
      clearItem() {
        this.mappingItem = {
          name: '',
          fields: [],
          protected: false,
          inUse: false,
        }
        this.$refs.workspaceMappingForm.resetValidation()
      },
      addField() {
        if (this.newField.key && this.newField.value) {
          this.mappingItem.fields.push({ ...this.newField })
          this.newField = {
            key: '',
            value: '',
          }
        }
      },
      removeField(index) {
        this.mappingItem.fields.splice(index, 1)
      },
      saveItem() {
        if (this.$refs.workspaceMappingForm.validate()) {
          this.$emit('add-item', { dialogName: 'mapping', item: this.mappingItem })
          this.showModal = false
          this.clearItem()
        }
      },
    },
  }
</script>

<style scoped>
  .mapping-list {
    overflow-y: auto;
    max-height: calc(100vh - 300px); /* Adjust height according to your needs */
    min-height: calc(100vh - 300px);
  }
</style>
