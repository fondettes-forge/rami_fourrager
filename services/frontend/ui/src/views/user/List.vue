<template>
  <v-container fluid>
    <v-data-table
      :headers="headers"
      :items="users"
      class="elevation-1"
      sort-by="email"
    >
      <template v-slot:top>
        <v-toolbar
          color="white"
          flat
        >
          <v-toolbar-title>{{ $t('user.list.title') }}</v-toolbar-title>
          <v-divider
            class="mx-4"
            inset
            vertical
          />
          <v-spacer />
          <v-dialog
            v-model="dialog"
            max-width="500px"
          >
            <template v-slot:activator="{ on }">
              <v-btn
                class="mb-2"
                color="primary"
                dark
                outlined
                v-on="on"
              >
                {{ $t('user.list.btn_add') }}
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col
                      cols="12"
                      md="12"
                      sm="12"
                    >
                      <v-text-field
                        v-model="editedItem.username"
                        :label="$t('user.modal.username')"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="12"
                      sm="12"
                    >
                      <v-text-field
                        v-model="editedItem.email"
                        :label="$t('user.modal.email')"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="12"
                      sm="12"
                    >
                      <v-text-field
                        v-model="editedItem.password"
                        :label="$t('user.modal.password')"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="12"
                      sm="12"
                    >
                      <v-select
                        v-model="editedItem.authorization"
                        :items="authorizationList"
                        item-text="name"
                        item-value="id"
                        :label="$t('user.modal.authorization')"
                        return-object
                        required
                        clearable
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="grey"
                  text
                  @click="close"
                >
                  {{ $t('btn.cancel') }}
                </v-btn>
                <v-btn
                  color="primary"
                  outlined
                  @click="save"
                >
                  {{ $t('btn.save') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon
          class="mr-2"
          small
          @click="editItem(item)"
        >
          mdi-pencil
        </v-icon>
        <v-icon
          small
          @click="deleteItem(item)"
        >
          mdi-delete
        </v-icon>
      </template>
      <template v-slot:no-data>
        <v-btn
          color="primary"
          @click="initialize"
        >
          {{ $t('btn.refresh') }}
        </v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    name: 'UserList',
    data: () => ({
      dialog: false,
      headers: [
        {
          text: 'Name',
          align: 'start',
          sortable: false,
          value: 'username',
        },
        { text: 'Email', value: 'email' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      users: [],
      editedIndex: -1,
      editedItem: {
        username: '',
        email: '',
        password: '',
        authorization: null,
      },
      defaultItem: {
        username: '',
        email: '',
        password: '',
        authorization: null,
      },
    }),

    computed: {
      ...mapState('user', {
        authorizationList: (state) => state.authorizations,
      }),

      formTitle() {
        return this.editedIndex === -1
          ? this.$t('user.modal.new')
          : this.$t('user.modal.edit', { name: this.editedItem.username })
      },
    },

    watch: {
      dialog(val) {
        val || this.close()
      },
    },

    created() {
      this.initialize()
    },

    methods: {
      initialize() {
        this.$store.dispatch('user/fetchAuthorizationList')
        this.$axios.get('/users').then((resp) => {
          this.users = resp.data
        })
      },

      editItem(item) {
        this.editedIndex = this.users.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialog = true
      },

      deleteItem(item) {
        var deletedIndex = this.users.indexOf(item)
        deletedIndex = Object.assign({}, item)
        confirm(this.$t('notifications.confirm_delete_item')) &&
          this.$axios({
            url: '/users/' + deletedIndex.id,
            method: 'Delete',
          })
            .then((resp) => {
              this.initialize()
            })
            .catch((err) => {
              console.error(err)
            })
      },

      close() {
        this.dialog = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },

      save() {
        if (this.editedIndex > -1) {
          this.$axios({
            url: '/users/' + this.editedItem.id,
            data: this.editedItem,
            method: 'PUT',
          })
            .then((resp) => {
              this.initialize()
            })
            .catch((err) => {
              console.error(err)
            })
        } else {
          const userData = {
            email: this.editedItem.email,
            username: this.editedItem.username,
            authorization: this.editedItem.authorization,
            password: this.editedItem.password,
          }
          this.$axios({
            url: '/users',
            data: userData,
            method: 'POST',
          })
            .then((resp) => {
              this.initialize()
            })
            .catch((err) => {
              console.error(err)
            })
        }
        this.close()
      },
    },
  }
</script>

<style scoped></style>
