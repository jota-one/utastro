/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    "id": "ut_users_collection",
    "name": "ut_users",
    "type": "auth",
    "system": false,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "listRule": null,
    "viewRule": null,
    "fields": [
      {
        "system": true,
        "id": "text3208210256",
        "name": "id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": true,
        "autoincrement": false,
        "min": 15,
        "max": 15,
        "pattern": "^[a-z0-9]+$",
        "primaryKey": true
      },
      {
        "system": true,
        "id": "text59357059",
        "name": "email",
        "type": "email",
        "required": true,
        "presentable": false,
        "unique": true
      },
      {
        "system": true,
        "id": "bool7291837461",
        "name": "verified",
        "type": "bool",
        "required": false,
        "presentable": false
      },
      {
        "system": true,
        "id": "bool2093847192",
        "name": "emailVisibility",
        "type": "bool",
        "required": false,
        "presentable": false
      },
      {
        "system": true,
        "id": "text1234567890",
        "name": "password",
        "type": "password",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text5555555555",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": true
      },
      {
        "system": false,
        "id": "select6666666666",
        "name": "role",
        "type": "select",
        "required": false,
        "presentable": true,
        "maxSelect": 1,
        "values": ["superadmin", "admin", "user", "coach"]
      },
      {
        "system": false,
        "id": "number7777777777",
        "name": "legacy_id",
        "type": "number",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text8888888888",
        "name": "legacy_password_sha1",
        "type": "text",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "bool9999999999",
        "name": "soft_deleted",
        "type": "bool",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text1111111111",
        "name": "street",
        "type": "text",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "number2222222222",
        "name": "npa",
        "type": "number",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text3333333333",
        "name": "city",
        "type": "text",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text4444444444",
        "name": "country",
        "type": "text",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text5555555556",
        "name": "phone",
        "type": "text",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "select6666666667",
        "name": "gender",
        "type": "select",
        "required": false,
        "presentable": false,
        "maxSelect": 1,
        "values": ["male", "female", "other"]
      },
      {
        "system": false,
        "id": "bool7777777778",
        "name": "accept_risks",
        "type": "bool",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "bool8888888889",
        "name": "accept_promo",
        "type": "bool",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "bool9999999998",
        "name": "accept_newsletter",
        "type": "bool",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text1010101010",
        "name": "region",
        "type": "text",
        "required": false,
        "presentable": false,
        "min": 2,
        "max": 2
      },
      {
        "system": false,
        "id": "number1111111112",
        "name": "birthdate",
        "type": "number",
        "required": false,
        "presentable": false
      }
    ],
    "indexes": []
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("ut_users");
  return app.delete(collection);
});
