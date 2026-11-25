<template>
  <v-dialog
    v-model="dialog"
    persistent
    no-click-animation
    max-width="600"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-form
        ref="climaticYearForm"
        v-model="valid"
        lazy-validation
        @submit.prevent="saveItem"
      >
        <v-card-text>
          <v-select
            v-model="climaticYear.site_id"
            :items="siteList"
            item-text="name"
            item-value="id"
            :label="$t('workspace.content.datatables.climaticYear.create.dialog.site')"
            :rules="[rules.required]"
            return-object
            :menu-props="{ offsetY: true, closeOnClick: true }"
          />
          <v-text-field
            v-model="climaticYear.name"
            :label="$t('workspace.content.datatables.climaticYear.create.dialog.name')"
            :rules="[rules.required]"
          />
          <v-text-field
            v-model="climaticYear.code"
            :label="$t('workspace.content.datatables.climaticYear.create.dialog.code')"
          />
          <v-textarea
            v-model="climaticYear.description"
            :label="$t('workspace.content.datatables.climaticYear.create.dialog.description')"
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
            {{ $t('btn.save') }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
  import { mapGetters } from 'vuex'
  import { deepCopy } from '@/plugins/utils'

  export default {
    name: 'ClimaticYearModal',
    props: {
      item: { type: null, required: true },
      dialog: Boolean,
      site: { type: null, default: null },
    },
    data() {
      return {
        climaticYear: {},
        valid: true,
        rules: {
          required: (value) => !!value || this.$t('validation.required'),
        },
      }
    },
    computed: {
      ...mapGetters('referential', {
        siteList: 'siteList',
      }),
      title() {
        return this.item && this.item.id
          ? this.$t('workspace.content.datatables.climaticYear.create.dialog.update_title')
          : this.$t('workspace.content.datatables.climaticYear.create.dialog.title')
      },
    },
    watch: {
      item: {
        immediate: true,
        handler(newValue) {
          if (newValue != null) {
            this.climaticYear = deepCopy(newValue)
            // si le site_id pointe vers un objet (return-object), on le convertit en id
            if (this.climaticYear.site_id && typeof this.climaticYear.site_id === 'object') {
              this.climaticYear.site_id = this.climaticYear.site_id.id
            }
          } else {
            this.climaticYear = { name: '', code: '', description: '', site_id: this.site ? this.site.id : null }
          }
        },
      },
      site: {
        immediate: true,
        handler(newValue) {
          if (newValue && !this.item) {
            this.climaticYear.site_id = newValue.id
          }
        },
      },
    },
    methods: {
      cancelModal() {
        this.clearItem()
        this.$emit('cancel-modal', 'climaticYear')
      },
      clearItem() {
        this.$refs.climaticYearForm.reset()
        this.climaticYear = {}
      },
      saveItem() {
        if (this.$refs.climaticYearForm.validate()) {
          // site_id peut être un objet (return-object) → on garde l'id
          const item = { ...this.climaticYear }
          if (item.site_id && typeof item.site_id === 'object') {
            item.site_id = item.site_id.id
          }
          this.$emit('add-item', { dialogName: 'climaticYear', item: deepCopy(item) })
          this.$toast({
            message: this.$t('workspace.content.datatables.climaticYear.create.dialog.add_success'),
            type: 'success',
            timeout: 3000,
          })
          this.cancelModal()
        }
      },
    },
  }
</script>
