resource "azurerm_app_configuration_key" "cosmos_db_endpoint" {
  configuration_store_id = local.infra.azure_app_config_resource_id
  key                    = "${local.front_app_dns_name}/cosmos_db_endpoint"
  value                  = "https://${local.infra.cosmos_db_account_name}.documents.azure.com:443/"
}
