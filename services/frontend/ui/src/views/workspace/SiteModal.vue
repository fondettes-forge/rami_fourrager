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
        ref="siteForm"
        v-model="valid"
        lazy-validation
        @submit.prevent="saveItem"
      >
        <v-card-text>
          <v-text-field
            v-model="site.name"
            :label="$t('workspace.content.datatables.site.create.dialog.name')"
            :rules="[rules.required]"
          />
          <v-text-field
            v-model="site.code"
            :label="$t('workspace.content.datatables.site.create.dialog.code')"
          />
          <v-textarea
            v-model="site.description"
            :label="$t('workspace.content.datatables.site.create.dialog.description')"
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
  import { deepCopy } from '@/plugins/utils'

  export default {
    name: 'SiteModal',
    props: {
      item: { type: null, required: true },
      dialog: Boolean,
    },
    data() {
      return {
        site: {},
        valid: true,
        rules: {
          required: (value) => !!value || this.$t('validation.required'),
        },
      }
    },
    computed: {
      title() {
        return this.item && this.item.id
          ? this.$t('workspace.content.datatables.site.create.dialog.update_title')
          : this.$t('workspace.content.datatables.site.create.dialog.title')
      },
    },
    watch: {
      item: {
        immediate: true,
        handler(newValue) {
          if (newValue != null) {
            this.site = deepCopy(newValue)
          } else {
            this.site = { name: '', code: '', description: '' }
          }
        },
      },
    },
    methods: {
      cancelModal() {
        this.clearItem()
        this.$emit('cancel-modal', 'site')
      },
      clearItem() {
        this.$refs.siteForm.reset()
        this.site = {}
      },
      saveItem() {
        if (this.$refs.siteForm.validate()) {
          this.$emit('add-item', { dialogName: 'site', item: deepCopy(this.site) })
          this.$toast({
            message: this.$t('workspace.content.datatables.site.create.dialog.add_success'),
            type: 'success',
            timeout: 3000,
          })
          this.cancelModal()
        }
      },
    },
  }
</script>
