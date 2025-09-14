# Relatório Comparativo: REST vs gRPC (Latência e Throughput)

**Disciplina:** Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas  
**Tema:** Comparação de desempenho entre REST (HTTP/JSON) e gRPC (HTTP/2 + Protobuf)  
**Escopo:** Análise sintética (1 página) com foco em latência e throughput para operações típicas de CRUD e streaming.

---
## 1. Fundamentação
- **REST**: Usa HTTP/1.1 (majoritariamente) e JSON como formato textual. Simplicidade e vasta compatibilidade, porém overhead maior (headers + texto verboso) e ausência nativa de multiplexação.
- **gRPC**: Usa HTTP/2 com multiplexação, compressão de cabeçalhos (HPACK) e mensagens binárias (Protocol Buffers). Reduz bytes transferidos e melhora uso de conexão persistente.

## 2. Métricas Observadas (Exemplo Didático)
Embora os números exatos dependam de ambiente (rede, hardware, payload, concorrência), a literatura e medições típicas em laboratórios mostram padrões como:

| Cenário (Req simples 1KB payload lógico) | REST (JSON)            | gRPC (Protobuf)        | Ganho Aproximado |
|------------------------------------------|------------------------|------------------------|------------------|
| Latência p50 (ms)                        | 8–12 ms                | 3–6 ms                 | ~40–60% menor    |
| Latência p95 (ms)                        | 18–25 ms               | 8–12 ms                | ~45–55% menor    |
| Throughput (req/s, 100 conexões)         | 2.5k–3.2k              | 4.0k–5.1k              | ~60–70% maior    |
| Tamanho médio da resposta (bytes)        | 950–1100               | 340–420                | ~60–65% menor    |
| Overhead de serialização (%)             | Alto (parsing JSON)    | Baixo (deserialização) | Redução significativa |
| Streaming bidirecional                   | Não nativo (workaround)| Nativo (1 conexão)     | Melhor escalabilidade |

> Observação: Valores didáticos ilustrativos baseados em padrões relatados em benchmarks públicos e exercícios acadêmicos; não representam medição oficial de produção.

## 3. Análise de Latência
- **Principais fontes de latência no REST**: parsing de JSON, falta de multiplexação (fila head-of-line em conexões limitadas), cabeçalhos mais extensos e handshake adicionais em múltiplas conexões.
- **gRPC reduz latência** via: multiplexação no HTTP/2, payload binário compacto e pipeline persistente. Em cenários de alta concorrência, a diferença cresce (p95 e p99 mais estáveis).

## 4. Análise de Throughput
- **REST** tende a saturar CPU em parsing/serialização antes de saturar rede para payloads pequenos.
- **gRPC** utiliza menos CPU por requisição e transfere menos bytes, liberando recursos para mais chamadas simultâneas.
- Em operações streaming (ex: notificações de tarefas ou chat), gRPC evita reabertura de conexões e reduz overhead por mensagem incremental.

## 5. Quando REST Ainda Faz Sentido
- Interoperabilidade ampla (browsers sem proxy extra / clientes simples).
- Exposição pública de APIs para terceiros sem toolchain Protobuf.
- Simplicidade onde latência não é fator crítico (batch diários, relatórios). 

## 6. Quando Preferir gRPC
- Microserviços internos de alta taxa de chamadas.
- Comunicação tempo real (streaming: logs, chat, notificações).
- Ambientes com restrição de banda ou necessidade de eficiência energética.
- Necessidade forte de contratos tipados e evolução de schema com retrocompatibilidade.

## 7. Trade-offs e Considerações
| Aspecto              | REST                              | gRPC                                   |
|----------------------|-----------------------------------|----------------------------------------|
| Facilidade de Teste  | cURL / Browser direto             | Requer ferramentas ou stub gerado      |
| Evolução de Schema   | Manual + versionamento na URL     | Protobuf com campos opcionais          |
| Observabilidade      | Ampla (ecosistema HTTP)           | Requer adaptação / interceptadores     |
| Aprendizado          | Baixo                            | Moderado (Protobuf + tooling)          |
| Compatibilidade Web  | Nativo (fetch)                    | Necessita proxy (até surgir Web gRPC)  |

## 8. Conclusão
gRPC apresenta vantagens consistentes em **latência** e **throughput**, principalmente sob carga concorrente e em cenários de streaming, devido à combinação de HTTP/2 + Protobuf. REST continua válido pela ubiquidade, simplicidade e facilidade de consumo público. Em uma arquitetura moderna híbrida, é comum: **REST para fronteiras externas** e **gRPC para comunicação interna de serviços de alta performance**.

---
**Resumo Final:** Para operações críticas e de alta frequência, gRPC tende a entregar de 40% a 60% menos latência e até ~70% mais throughput em comparação com REST tradicional baseado em JSON, ao custo de maior complexidade inicial e dependência de ferramentas de geração de código.
