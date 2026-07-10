/// <reference path="../pb_data/types.d.ts" />

// The legacy presence column was tri-state (null = not checked yet, 0 =
// absent, 1 = present) while the PocketBase bool can only hold two states.
// presence_checked carries the third state: presence is only meaningful
// once presence_checked is true.
migrate(
  app => {
    const collection = app.findCollectionByNameOrId('ut_subscriptions')
    collection.fields.add(
      new Field({
        system: false,
        id: 'bool_subs_presence_checked',
        name: 'presence_checked',
        type: 'bool',
        required: false,
        presentable: false,
      }),
    )
    app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_subscriptions')
    collection.fields.removeById('bool_subs_presence_checked')
    app.save(collection)
  },
)
