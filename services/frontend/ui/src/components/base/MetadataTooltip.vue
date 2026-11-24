<template>
  <span v-if="hasContent">
    <v-tooltip
      bottom
      max-width="350"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <slot />
        </span>
      </template>
      <span>
        <span
          v-if="description"
          class="d-block"
        >
          {{ description }}
        </span>
        <span
          v-if="source"
          class="d-block"
        >
          {{ $t('metadata.source') }} : {{ source }}
        </span>
        <span
          v-if="updatedLabel"
          class="d-block"
        >
          {{ $t('metadata.updatedAt') }} : {{ updatedLabel }}
        </span>
      </span>
    </v-tooltip>
  </span>
  <span v-else>
    <slot />
  </span>
</template>

<script>
  // Ticket 24 — tooltip consolidé des métadonnées référentiel :
  // description (ou résumé) + source + date de mise à jour, au survol du libellé.
  // Les lignes vides ne s'affichent pas.
  export default {
    name: 'MetadataTooltip',
    props: {
      description: {
        type: String,
        default: '',
      },
      source: {
        type: String,
        default: '',
      },
      updatedAt: {
        type: String,
        default: '',
      },
    },
    computed: {
      hasContent() {
        return !!(this.description || this.source || this.updatedLabel)
      },
      updatedLabel() {
        if (!this.updatedAt) {
          return ''
        }
        const d = new Date(this.updatedAt)
        if (Number.isNaN(d.getTime())) {
          return ''
        }
        return d.toLocaleDateString('fr-FR')
      },
    },
  }
</script>
