locals {
  infra = {
    resource_group_name          = "infra"
    dns_zone_name                = "romaine.life"
    cosmos_db_account_name       = "infra-cosmos-serverless"
    cosmos_db_account_id         = "/subscriptions/aee0cbd2-8074-4001-b610-0f8edb4eaa3c/resourceGroups/infra/providers/Microsoft.DocumentDB/databaseAccounts/infra-cosmos-serverless"
    azure_app_config_endpoint    = "https://infra-appconfig.azconfig.io"
    azure_app_config_resource_id = "/subscriptions/aee0cbd2-8074-4001-b610-0f8edb4eaa3c/resourceGroups/infra/providers/Microsoft.AppConfiguration/configurationStores/infra-appconfig"
    key_vault_name               = "romaine-kv"
  }
}

# AKS cluster OIDC issuer URL comes from infra-bootstrap's state output.
# Can't read it directly from `data "azurerm_kubernetes_cluster"` here:
# the cluster lives in a dedicated subscription and our CI principal only
# has access to the app subscription — the data source 404s. The tfstate
# blob, on the other hand, is in this subscription's storage account and
# is already in our principal's reach. Pattern matches glimmung/tofu/remote-state.tf.
data "terraform_remote_state" "infra_bootstrap" {
  backend = "azurerm"

  config = {
    resource_group_name  = "infra"
    storage_account_name = "nelsontofu"
    container_name       = "tfstate"
    key                  = "infra-bootstrap.tfstate"
    use_oidc             = true
  }
}

locals {
  aks_oidc_issuer_url = data.terraform_remote_state.infra_bootstrap.outputs.aks_oidc_issuer_url
}
