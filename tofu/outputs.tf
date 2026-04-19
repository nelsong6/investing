output "resource_group_name" {
  value       = azurerm_resource_group.investing.name
  description = "Name of the resource group"
}

output "cosmos_db_database_name" {
  value       = azurerm_cosmosdb_sql_database.investing.name
  description = "Cosmos DB database name"
}

output "cosmos_db_container_name" {
  value       = azurerm_cosmosdb_sql_container.portfolios.name
  description = "Cosmos DB container name for portfolio data"
}

output "app_config_prefix" {
  value       = local.front_app_dns_name
  description = "App Configuration key prefix"
}
