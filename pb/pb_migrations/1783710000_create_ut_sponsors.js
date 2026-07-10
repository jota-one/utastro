/// <reference path="../pb_data/types.d.ts" />

// Sponsors are managed in the DB (admin CRUD) and displayed as a logo
// band at the bottom of city pages: global sponsors show on every city,
// the others only on the cities they are linked to.
migrate(
  app => {
    const adminRule =
      '@request.auth.role = "admin" || @request.auth.role = "superadmin"'
    const cities = app.findCollectionByNameOrId('ut_cities')

    const collection = new Collection({
      name: 'ut_sponsors',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          system: false,
          id: 'text_sponsors_name',
          name: 'name',
          type: 'text',
          required: true,
          presentable: true,
        },
        {
          system: false,
          id: 'file_sponsors_logo',
          name: 'logo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: [
            'image/png',
            'image/jpeg',
            'image/svg+xml',
            'image/webp',
          ],
          thumbs: ['100x100'],
        },
        {
          system: false,
          id: 'url_sponsors_link',
          name: 'link',
          type: 'url',
          required: false,
        },
        {
          system: false,
          id: 'bool_sponsors_global',
          name: 'global',
          type: 'bool',
          required: false,
        },
        {
          system: false,
          id: 'rel_sponsors_cities',
          name: 'cities',
          type: 'relation',
          required: false,
          collectionId: cities.id,
          cascadeDelete: false,
          minSelect: 0,
          maxSelect: 999,
        },
        {
          system: false,
          id: 'bool_sponsors_enabled',
          name: 'enabled',
          type: 'bool',
          required: false,
        },
      ],
    })
    app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_sponsors')
    app.delete(collection)
  },
)
