resource "azurerm_cosmosdb_sql_database" "investing" {
  name                = "InvestingDB"
  resource_group_name = local.infra.resource_group_name
  account_name        = local.infra.cosmos_db_account_name

  lifecycle {
    ignore_changes = [throughput]
  }
}

resource "azurerm_cosmosdb_sql_container" "portfolios" {
  name                = "portfolios"
  resource_group_name = local.infra.resource_group_name
  account_name        = local.infra.cosmos_db_account_name
  database_name       = azurerm_cosmosdb_sql_database.investing.name
  partition_key_paths = ["/userId"]

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}
