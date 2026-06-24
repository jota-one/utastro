/// <reference path="../pb_data/types.d.ts" />

const STYLES = `
  html, body, table, tbody, tr, th, td { margin: 0; padding: 0; }
  html {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 17px;
    font-weight: 300;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  body { background: rgb(246, 246, 246); }
  table { border-spacing: 0; margin: 0 auto; width: 100%; max-width: 600px; }
  a { display: inline-block; color: rgb(53, 182, 90); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .ut-logo { margin: 0 0 40px -40px; }
  td.content { padding: 30px 50px 60px; background: white; border-radius: 5px; box-shadow: 0 0 20px rgba(128, 128, 128, 0.1); }
  td.footer { padding: 30px; text-align: center; vertical-align: middle; font-size: 12px; font-weight: 300; color: rgb(100, 100, 100); }
  td.footer a { margin: 10px; }
  h1 { display: inline-block; padding: 7px 12px; font-size: 25px; font-weight: 900; color: white; background: black; }
  .space { margin-top: 30px; }
  .link td { vertical-align: top; }
  .link td img { margin-right: 5px; }
  .link td a { display: block; padding-top: 2px; font-size: 17px; font-weight: 700; }
  .info { padding-top: 20px; font-size: 14px; font-weight: 300; color: rgb(120, 120, 120); }
`

const FOOTER = `
  <tr>
    <td class="footer">
      <a href="https://www.urban-training.ch/" target="_blank">
        <img src="{APP_URL}/img/email/utg.png" width="100" height="27" />
      </a>
      <a href="https://www.facebook.com/people/Urban-Training-Gratuit/100067985083966/" target="_blank">
        <img src="{APP_URL}/img/email/fb.png" width="32" height="32" />
      </a>
      <br><br>
      &copy; Association Urban Training
    </td>
  </tr>
`

const verificationBody = `<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <style>${STYLES}</style>
  <table>
    <tr>
      <td>
        <img class="ut-logo" src="{APP_URL}/img/email/ut.png" width="244" height="90" />
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1>Bienvenue !</h1>
        <p>
          C'est avec grand plaisir que nous te confirmons ton inscription dans la communauté <b>Urban Training!</b>
        </p>
        <table class="link space">
          <tr>
            <td>
              <img src="{APP_URL}/img/email/arrow.png" width="24" height="24" />
            </td>
            <td width="100%">
              <a href="{APP_URL}/fr/inscription/activation?token={TOKEN}" target="_blank">
                Finalise l'activation de ton compte en cliquant ici!
              </a>
            </td>
          </tr>
        </table>
        <p class="space">
          Toute l'équipe se réjouit de t'accueillir pour un prochain cours !
        </p>
        <p><b>Team Urban Training</b></p>
      </td>
    </tr>
    ${FOOTER}
  </table>
</body>
</html>`

const resetPasswordBody = `<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <style>${STYLES}</style>
  <table>
    <tr>
      <td>
        <img class="ut-logo" src="{APP_URL}/img/email/ut.png" width="244" height="90" />
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1>Réinitialise ton mot de passe</h1>
        <table class="link space">
          <tr>
            <td>
              <img src="{APP_URL}/img/email/arrow.png" width="24" height="24" />
            </td>
            <td width="100%">
              <a href="{APP_URL}/fr/profil/reinitialisation?token={TOKEN}" target="_blank">
                Clique ici pour réinitialiser ton mot de passe!
              </a>
            </td>
          </tr>
        </table>
        <p class="space">
          <b>Team Urban Training</b>
        </p>
      </td>
    </tr>
    ${FOOTER}
  </table>
</body>
</html>`

migrate(
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')

    unmarshal(
      {
        verificationTemplate: {
          subject: 'Active ton compte Urban Training',
          body: verificationBody,
        },
        resetPasswordTemplate: {
          subject: 'Réinitialise ton mot de passe Urban Training',
          body: resetPasswordBody,
        },
      },
      collection,
    )

    return app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')

    unmarshal(
      {
        verificationTemplate: { subject: '', body: '' },
        resetPasswordTemplate: { subject: '', body: '' },
      },
      collection,
    )

    return app.save(collection)
  },
)
