<template>
  <v-dialog
    v-model="dialog"
    persistent
    no-click-animation
    max-width="600"
  >
    <v-card>
      <v-card-title>{{ $t('workspace.content.datatables.simulation.duplicate.dialog.title') }}</v-card-title>
      <v-form
        ref="duplicateForm"
        v-model="valid"
        lazy-validation
        @submit.prevent="saveItem"
      >
        <v-card-text>
          <v-text-field
            v-model="duplicate.name"
            :label="$t('workspace.content.datatables.simulation.duplicate.dialog.name')"
            :rules="[rules.required]"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            text
            @click="cancelModal"
          >
            {{ $t('workspace.content.datatables.simulation.create.dialog.btn_cancel') }}
          </v-btn>
          <v-btn
            outlined
            color="green"
            type="submit"
            :disabled="!valid"
          >
            {{ $t('btn.duplicate') }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    name: 'SimulationDuplicateModal',
    props: {
      item: {
        type: null,
        required: true,
      },
      dialog: Boolean,
    },
    data() {
      return {
        duplicate: { name: '' },
        valid: true,
        rules: {
          required: (value) => !!value || this.$t('validation.required'),
        },
      }
    },
    watch: {
      item: {
        immediate: true,
        handler(newValue) {
          if (newValue != null) {
            // pré-rempli : « Nom original (copie) »
            this.duplicate.name = newValue.name + ' (copie)'
          }
        },
      },
    },
    methods: {
      cancelModal() {
        this.clearItem()
        this.$emit('cancel-modal', 'simulation')
      },
      clearItem() {
        this.$refs.duplicateForm.reset()
        this.duplicate = { name: '' }
      },
      saveItem() {
        if (this.$refs.duplicateForm.validate()) {
          this.$emit('add-item', { dialogName: 'simulation', item: this.item, name: this.duplicate.name })
          this.$toast({
            message: this.$t('workspace.content.datatables.simulation.duplicate.dialog.add_success'),
            type: 'success',
            timeout: 3000,
          })
          this.cancelModal()
        } else {
          this.$toast({
            message: this.$t('workspace.content.datatables.simulation.create.dialog.add_error'),
            type: 'warning',
            timeout: 5000,
          })
        }
      },
    },
  }
</script>
