flowchart TD
    subgraph Client ["Frontend (Next.js + Shadcn UI)"]
        Router{"라우팅 (page.tsx)"}
        Landing[Landing Page]
        Login[Login Page]
        
        subgraph Dashboard ["App Dashboard (/dashboard)"]
            Sidebar["사이드바 (History/Profile)"]
            MainArea[메인 작업 영역]
            
            subgraph Modules [분석 모듈]
                SourceA[Source A 카드]
                SourceB[Source B 카드]
                SourceC[Source C 카드]
                Synth[통합 분석 카드]
            end
            
            ConfigModal["설정 모달 (URL/Key/View)"]
        end
    end

    subgraph Server ["Backend Infrastructure (Recommended)"]
        API[FastAPI Server]
        Scheduler["Celery Beat (Cron)"]
        Worker[Celery Worker]
    end

    subgraph Data ["Data Storage"]
        PG[("PostgreSQL - User/Report")]
        Redis[("Redis - Task Queue")]
        Pinecone[("Vector DB - Preference")]
    end

    subgraph External ["External Services"]
        Tavily["Tavily API (Web Browsing)"]
        OpenAI["GPT-4o (LLM)"]
    end

    %% Flow Connections
    Router -->|default| Landing
    Router -->|auth| Login
    Router -->|success| Dashboard
    
    Landing --> Login
    Login --> Dashboard
    
    Sidebar -->|Select Report| MainArea
    MainArea --> Modules
    SourceA & SourceB & SourceC -->|Click| ConfigModal
    
    ConfigModal -->|Save & Generate| API
    Synth -->|Synthesize| API
    
    API -->|Async Task| Redis
    Redis -->|Consume| Worker
    Worker -->|Crawl| Tavily
    Worker -->|Analyze| OpenAI
    Worker -->|Save Result| PG
    
    Scheduler -->|Trigger| Redis