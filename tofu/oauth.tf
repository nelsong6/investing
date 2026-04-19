# ============================================================================
# Microsoft "Sign in with Microsoft" — investing only
# ============================================================================
# Decentralized from infra-bootstrap's shared social-login app registration so
# this app owns its own redirect URIs. The shared api middleware and this
# app's own backend both load every `*/microsoft_oauth_client_id` key from
# App Configuration and accept tokens against the union of audiences — no
# cross-repo coordination needed to add or rotate a per-app registration.

data "azuread_client_config" "current" {}

resource "azuread_application" "microsoft_login" {
  display_name     = "investing - Social Login"
  sign_in_audience = "AzureADandPersonalMicrosoftAccount"

  # The azuread provider does NOT auto-add the creating SP as an owner, so
  # `Application.ReadWrite.OwnedBy` (the permission this repo's SP holds)
  # returns 403 on any subsequent tofu update. Declare explicitly so owners
  # match the tofu-run principal.
  owners = [data.azuread_client_config.current.object_id]

  api {
    requested_access_token_version = 2
  }

  single_page_application {
    redirect_uris = [
      "https://investing.romaine.life/",
      # Local dev — backend serves frontend + API on same origin at :3000.
      "http://localhost:3000/",
    ]
  }
}

# Publish the client ID so the backend (and the shared api, during transition)
# discovers it by listing keys matching `*/microsoft_oauth_client_id`.
resource "azurerm_app_configuration_key" "microsoft_oauth_client_id" {
  configuration_store_id = local.infra.azure_app_config_resource_id
  key                    = "investing/microsoft_oauth_client_id"
  value                  = azuread_application.microsoft_login.client_id
}
