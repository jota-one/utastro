/// <reference path="../pb_data/types.d.ts" />

// The ut_users `id` field was imported without an autogenerate pattern,
// which makes every record creation fail with "id: Cannot be blank"
// unless an explicit id is provided. Restore the default pattern.
migrate(
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    collection.fields.addAt(
      0,
      new Field({
        autogeneratePattern: '[a-z0-9]{15}',
        hidden: false,
        id: 'text3208210256',
        max: 15,
        min: 15,
        name: 'id',
        pattern: '^[a-z0-9]+$',
        presentable: false,
        primaryKey: true,
        required: true,
        system: true,
        type: 'text',
      }),
    )
    app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    collection.fields.addAt(
      0,
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'text3208210256',
        max: 15,
        min: 15,
        name: 'id',
        pattern: '^[a-z0-9]+$',
        presentable: false,
        primaryKey: true,
        required: true,
        system: true,
        type: 'text',
      }),
    )
    app.save(collection)
  },
)
