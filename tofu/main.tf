resource "azurerm_resource_group" "investing" {
  name     = "investing-rg"
  location = var.location
}

# Used as the App Configuration key prefix for per-app settings.
# Previously also named the SWA + DNS CNAME; now that the app runs on AKS,
# the only remaining user is the App Config key prefix.
locals {
  front_app_dns_name = "investing"
}
