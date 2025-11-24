# Script para inicializar dados do Item Service
Write-Host "Inicializando dados do Item Service..." -ForegroundColor Cyan

# Função para criar item
function Criar-Item {
    param($item)
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3003/items" -Method POST -Body ($item | ConvertTo-Json) -ContentType "application/json"
        Write-Host "Item criado: $($item.name)" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "Erro ao criar $($item.name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Itens de exemplo
$items = @(
    @{
        name = "Arroz Branco Tipo 1"
        category = "Alimentos"
        brand = "Tio Joao"
        unit = "kg"
        averagePrice = 6.99
        barcode = "7891234567890"
        description = "Arroz branco tipo 1, pacote 5kg"
        active = $true
    },
    @{
        name = "Feijao Carioca"
        category = "Alimentos"
        brand = "Camil"
        unit = "kg"
        averagePrice = 8.50
        barcode = "7891234567891"
        description = "Feijao carioca tipo 1, pacote 1kg"
        active = $true
    },
    @{
        name = "Acucar Cristal"
        category = "Alimentos"
        brand = "Uniao"
        unit = "kg"
        averagePrice = 4.99
        barcode = "7891234567892"
        description = "Acucar cristal refinado, pacote 1kg"
        active = $true
    },
    @{
        name = "Detergente Liquido"
        category = "Limpeza"
        brand = "Ype"
        unit = "un"
        averagePrice = 2.99
        barcode = "7891234567895"
        description = "Detergente liquido neutro, frasco 500ml"
        active = $true
    },
    @{
        name = "Sabao em Po"
        category = "Limpeza"
        brand = "OMO"
        unit = "kg"
        averagePrice = 12.99
        barcode = "7891234567896"
        description = "Sabao em po concentrado, caixa 1kg"
        active = $true
    }
)

# Criar itens
foreach ($item in $items) {
    Criar-Item -item $item
    Start-Sleep -Milliseconds 100
}

Write-Host "`nVerificando resultados..." -ForegroundColor Cyan

# Verificar itens criados
try {
    $allItems = Invoke-RestMethod -Uri "http://localhost:3003/items"
    Write-Host "Total de itens: $($allItems.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "Erro ao verificar itens: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar categorias
try {
    $categories = Invoke-RestMethod -Uri "http://localhost:3003/categories"
    Write-Host "Total de categorias: $($categories.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "Erro ao verificar categorias: $($_.Exception.Message)" -ForegroundColor Red
}