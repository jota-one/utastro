/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const citiesCollection = new Collection({
      name: 'ut_cities',
      type: 'base',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      listRule: '',
      viewRule: '',
      fields: [
        {
          system: false,
          id: 'text_cities_label',
          name: 'label',
          type: 'text',
          required: true,
          presentable: true,
        },
        {
          system: false,
          id: 'text_cities_slug',
          name: 'slug',
          type: 'text',
          required: false,
          presentable: false,
        },
        {
          system: false,
          id: 'text_cities_coords',
          name: 'coords',
          type: 'text',
          required: false,
          presentable: false,
        },
        {
          system: false,
          id: 'bool_cities_enabled',
          name: 'enabled',
          type: 'bool',
          required: false,
          presentable: false,
        },
        {
          system: false,
          id: 'number_cities_legacy_id',
          name: 'legacy_id',
          type: 'number',
          required: false,
          presentable: false,
        },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_ut_cities_legacy_id ON ut_cities (legacy_id)'],
    })
    app.save(citiesCollection)

    const savedCities = app.findCollectionByNameOrId('ut_cities')

    const watchersCollection = new Collection({
      name: 'ut_city_watchers',
      type: 'base',
      createRule: '@request.auth.id != ""',
      updateRule: null,
      deleteRule: '@request.auth.id = user.id',
      listRule: '@request.auth.id = user.id',
      viewRule: '@request.auth.id = user.id',
      fields: [
        {
          system: false,
          id: 'relation_watchers_user',
          name: 'user',
          type: 'relation',
          required: true,
          presentable: false,
          collectionId: 'ut_users_collection',
          cascadeDelete: true,
          maxSelect: 1,
          minSelect: 0,
        },
        {
          system: false,
          id: 'relation_watchers_city',
          name: 'city',
          type: 'relation',
          required: true,
          presentable: false,
          collectionId: savedCities.id,
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: 0,
        },
        {
          system: false,
          id: 'number_watchers_legacy_user_id',
          name: 'legacy_user_id',
          type: 'number',
          required: false,
          presentable: false,
        },
        {
          system: false,
          id: 'number_watchers_legacy_city_id',
          name: 'legacy_city_id',
          type: 'number',
          required: false,
          presentable: false,
        },
      ],
      indexes: ['CREATE INDEX idx_ut_city_watchers_user ON ut_city_watchers ("user")'],
    })
    app.save(watchersCollection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('ut_city_watchers'))
    } catch {}
    try {
      app.delete(app.findCollectionByNameOrId('ut_cities'))
    } catch {}
  },
)
