# Per-app workload identity for investing — replaces reuse of
# infra-shared-identity (overbroad RBAC across all apps' data planes).
# Scoped to only what backend/config.js + server.js actually call:
#   - Cosmos data on dbs/InvestingDB (the only DB the pod queries)
#   - KV Secrets User on the single secret (investing-jwt-signing-secret)
#   - App Configuration Data Reader at store level — config.js reads
#     `investing/cosmos_db_endpoint` from there.
# Pattern mirrors kill-me/tofu/identity.tf and glimmung/tofu/identity.tf.

data "azurerm_resource_group" "infra" {
  name = local.infra.resource_group_name
}

resource "azurerm_user_assigned_identity" "investing" {
  name                = "investing-identity"
  resource_group_name = data.azurerm_resource_group.infra.name
  location            = data.azurerm_resource_group.infra.location
}

# Cosmos data plane scope is `<account>/dbs/<name>`, NOT the ARM resource ID
# format `<account>/sqlDatabases/<name>` — the Cosmos service rejects the
# ARM form with "Expected path segment [dbs] at position [0] but found
# [sqlDatabases]."
resource "azurerm_cosmosdb_sql_role_assignment" "investing_cosmos" {
  resource_group_name = local.infra.resource_group_name
  account_name        = local.infra.cosmos_db_account_name
  role_definition_id  = "${local.infra.cosmos_db_account_id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id        = azurerm_user_assigned_identity.investing.principal_id
  scope               = "${local.infra.cosmos_db_account_id}/dbs/${azurerm_cosmosdb_sql_database.investing.name}"
}

resource "azurerm_role_assignment" "investing_kv_jwt_secret" {
  scope                = "${data.azurerm_key_vault.main.id}/secrets/investing-jwt-signing-secret"
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.investing.principal_id
}

resource "azurerm_role_assignment" "investing_appconfig" {
  scope                = local.infra.azure_app_config_resource_id
  role_definition_name = "App Configuration Data Reader"
  principal_id         = azurerm_user_assigned_identity.investing.principal_id
}

resource "azurerm_federated_identity_credential" "investing" {
  name                = "aks-investing"
  resource_group_name = local.infra.resource_group_name
  parent_id           = azurerm_user_assigned_identity.investing.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = var.cluster_oidc_issuer_url
  subject             = "system:serviceaccount:investing:infra-shared"
}

output "investing_identity_client_id" {
  value       = azurerm_user_assigned_identity.investing.client_id
  description = "Pin into k8s/serviceaccount.yaml's azure.workload.identity/client-id annotation."
}
