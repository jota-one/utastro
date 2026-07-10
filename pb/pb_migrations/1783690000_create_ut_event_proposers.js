/// <reference path="../pb_data/types.d.ts" />

migrate(
  app => {
    const adminRule =
      '@request.auth.role = "admin" || @request.auth.role = "superadmin"'

    const collection = new Collection({
      name: 'ut_event_proposers',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          system: false,
          id: 'text_proposers_label',
          name: 'label',
          type: 'text',
          required: true,
          presentable: true,
          max: 100,
        },
        {
          system: false,
          id: 'bool_proposers_enabled',
          name: 'enabled',
          type: 'bool',
          required: false,
          presentable: false,
        },
        {
          system: false,
          id: 'number_proposers_legacy_id',
          name: 'legacy_id',
          type: 'number',
          required: false,
          presentable: false,
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_ut_event_proposers_legacy_id ON ut_event_proposers (legacy_id) WHERE legacy_id != 0',
      ],
    })
    app.save(collection)

    // seed with the single legacy record
    const saved = app.findCollectionByNameOrId('ut_event_proposers')
    const record = new Record(saved)
    record.set('label', 'Urban Training')
    record.set('enabled', true)
    record.set('legacy_id', 1)
    app.save(record)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_event_proposers')
    app.delete(collection)
  },
)
