FROM langchain/langgraphjs-api:20

ADD . /deps/finanzIA-agent
WORKDIR /deps/finanzIA-agent

ENV LANGSERVE_GRAPHS='{"financial_agent":"./workflows/agents/financial-agent.ts:agent"}'

RUN npm ci
RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8000/ok || exit 1