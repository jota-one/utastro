/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // --- ut_event_types ---
    const eventTypesCollection = new Collection({
      name: 'ut_event_types',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { system: false, id: 'text_et_xid',       name: 'xid',       type: 'text', required: true,  presentable: true  },
        { system: false, id: 'bool_et_enabled',    name: 'enabled',   type: 'bool', required: false, presentable: false },
        { system: false, id: 'text_et_label_fr',   name: 'label_fr',  type: 'text', required: false, presentable: false },
        { system: false, id: 'text_et_label_de',   name: 'label_de',  type: 'text', required: false, presentable: false },
        { system: false, id: 'text_et_label_en',   name: 'label_en',  type: 'text', required: false, presentable: false },
        { system: false, id: 'number_et_legacy_id', name: 'legacy_id', type: 'number', required: false, presentable: false },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_ut_event_types_legacy_id ON ut_event_types (legacy_id)'],
    })
    app.save(eventTypesCollection)

    // --- ut_locations ---
    const citiesCollection = app.findCollectionByNameOrId('ut_cities')
    const locationsCollection = new Collection({
      name: 'ut_locations',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { system: false, id: 'text_loc_address',    name: 'address',   type: 'text', required: false, presentable: false },
        { system: false, id: 'bool_loc_enabled',    name: 'enabled',   type: 'bool', required: false, presentable: false },
        { system: false, id: 'text_loc_coords',     name: 'coords',    type: 'text', required: false, presentable: false },
        { system: false, id: 'text_loc_xid',        name: 'xid',       type: 'text', required: false, presentable: false },
        {
          system: false, id: 'relation_loc_city', name: 'city', type: 'relation',
          required: false, presentable: false,
          collectionId: citiesCollection.id, cascadeDelete: false, maxSelect: 1, minSelect: 0,
        },
        { system: false, id: 'text_loc_label_fr',   name: 'label_fr',  type: 'text', required: false, presentable: true  },
        { system: false, id: 'text_loc_label_de',   name: 'label_de',  type: 'text', required: false, presentable: false },
        { system: false, id: 'text_loc_label_en',   name: 'label_en',  type: 'text', required: false, presentable: false },
        { system: false, id: 'number_loc_legacy_id', name: 'legacy_id', type: 'number', required: false, presentable: false },
        { system: false, id: 'number_loc_legacy_city_id', name: 'legacy_city_id', type: 'number', required: false, presentable: false },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_ut_locations_legacy_id ON ut_locations (legacy_id)'],
    })
    app.save(locationsCollection)

    // --- ut_events ---
    const savedLocations = app.findCollectionByNameOrId('ut_locations')
    const savedEventTypes = app.findCollectionByNameOrId('ut_event_types')
    const eventsCollection = new Collection({
      name: 'ut_events',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { system: false, id: 'text_ev_start_date',   name: 'start_date',   type: 'text', required: false, presentable: false },
        { system: false, id: 'text_ev_end_date',     name: 'end_date',     type: 'text', required: false, presentable: false },
        { system: false, id: 'text_ev_sub_pub_date', name: 'subscription_publish_date', type: 'text', required: false, presentable: false },
        { system: false, id: 'number_ev_max_sub',    name: 'max_subscriptions',  type: 'number', required: false, presentable: false },
        {
          system: false, id: 'select_ev_progress', name: 'progress', type: 'select',
          required: false, presentable: false, maxSelect: 1,
          values: ['over', 'open', 'running', 'paused', 'cancelled'],
        },
        { system: false, id: 'text_ev_attendees',    name: 'attendees',    type: 'text', required: false, presentable: false },
        {
          system: false, id: 'relation_ev_location', name: 'location', type: 'relation',
          required: false, presentable: false,
          collectionId: savedLocations.id, cascadeDelete: false, maxSelect: 1, minSelect: 0,
        },
        {
          system: false, id: 'relation_ev_city', name: 'city', type: 'relation',
          required: false, presentable: false,
          collectionId: citiesCollection.id, cascadeDelete: false, maxSelect: 1, minSelect: 0,
        },
        {
          system: false, id: 'relation_ev_types', name: 'types', type: 'relation',
          required: false, presentable: false,
          collectionId: savedEventTypes.id, cascadeDelete: false, maxSelect: 100, minSelect: 0,
        },
        { system: false, id: 'text_ev_title_fr',     name: 'title_fr',     type: 'text', required: false, presentable: true  },
        { system: false, id: 'text_ev_title_de',     name: 'title_de',     type: 'text', required: false, presentable: false },
        { system: false, id: 'text_ev_title_en',     name: 'title_en',     type: 'text', required: false, presentable: false },
        { system: false, id: 'text_ev_desc_fr',      name: 'description_fr', type: 'text', required: false, presentable: false },
        { system: false, id: 'text_ev_desc_de',      name: 'description_de', type: 'text', required: false, presentable: false },
        { system: false, id: 'text_ev_desc_en',      name: 'description_en', type: 'text', required: false, presentable: false },
        { system: false, id: 'number_ev_sub_count',  name: 'subscription_count', type: 'number', required: false, presentable: false },
        { system: false, id: 'number_ev_staff_count', name: 'staff_count', type: 'number', required: false, presentable: false },
        { system: false, id: 'number_ev_legacy_id',  name: 'legacy_id',    type: 'number', required: false, presentable: false },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_ut_events_legacy_id ON ut_events (legacy_id)',
        'CREATE INDEX idx_ut_events_start_date ON ut_events (start_date)',
        'CREATE INDEX idx_ut_events_city ON ut_events (city)',
      ],
    })
    app.save(eventsCollection)

    // --- ut_subscriptions ---
    const savedEvents = app.findCollectionByNameOrId('ut_events')
    const subscriptionsCollection = new Collection({
      name: 'ut_subscriptions',
      type: 'base',
      listRule: '@request.auth.id = user.id',
      viewRule: '@request.auth.id = user.id',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id = user.id',
      deleteRule: '@request.auth.id = user.id',
      fields: [
        {
          system: false, id: 'relation_sub_user', name: 'user', type: 'relation',
          required: true, presentable: false,
          collectionId: 'ut_users_collection', cascadeDelete: true, maxSelect: 1, minSelect: 0,
        },
        {
          system: false, id: 'relation_sub_event', name: 'event', type: 'relation',
          required: true, presentable: false,
          collectionId: savedEvents.id, cascadeDelete: false, maxSelect: 1, minSelect: 0,
        },
        { system: false, id: 'bool_sub_presence',       name: 'presence',       type: 'bool', required: false, presentable: false },
        { system: false, id: 'bool_sub_is_event_admin', name: 'is_event_admin', type: 'bool', required: false, presentable: false },
        { system: false, id: 'number_sub_legacy_user_id',  name: 'legacy_user_id',  type: 'number', required: false, presentable: false },
        { system: false, id: 'number_sub_legacy_event_id', name: 'legacy_event_id', type: 'number', required: false, presentable: false },
      ],
      indexes: [
        'CREATE INDEX idx_ut_subscriptions_user ON ut_subscriptions ("user")',
        'CREATE INDEX idx_ut_subscriptions_event ON ut_subscriptions (event)',
      ],
    })
    app.save(subscriptionsCollection)
  },
  (app) => {
    for (const name of ['ut_subscriptions', 'ut_events', 'ut_locations', 'ut_event_types']) {
      try { app.delete(app.findCollectionByNameOrId(name)) } catch (_) {}
    }
  },
)
