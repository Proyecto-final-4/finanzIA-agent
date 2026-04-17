FROM langchain/langgraphjs-api:20
ADD . /deps/finanzIA-agent
ENV LANGSERVE_GRAPHS='{"financial_agent":"./workflows/agents/financial-agent.ts:agent"}'
ENV LANGGRAPH_STORE='{"uri":"${DATABASE_URI}"}'
WORKDIR /deps/finanzIA-agent
RUN npm ci
RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts