backend     

INFO:     172.19.0.1:51344 - "OPTIONS /api/v1/courses HTTP/1.1" 200 OK

INFO:     172.19.0.1:51346 - "OPTIONS /api/v1/courses HTTP/1.1" 200 OK

INFO:     172.19.0.1:51344 - "GET /api/v1/courses HTTP/1.1" 200 OK

INFO:     172.19.0.1:51346 - "GET /api/v1/courses HTTP/1.1" 200 OK

INFO:     172.19.0.1:51346 - "GET /api/v1/courses HTTP/1.1" 200 OK

INFO:     172.19.0.1:39528 - "OPTIONS /api/v1/ai/generate/structure HTTP/1.1" 200 OK

2026-03-22 15:43:05 - app.api.ai_proxy - INFO - generate_course_structure called with: {'user_prompt': 'Основы IT. Старт в IT с нуля \n\nБез привязки к конкретной профессии, общие знания, концепции. База для спеца в любом направлении', 'difficulty': 'intermediate', 'depth_limit': 4, 'user_id': 'demo-user-1'}

2026-03-22 15:43:05 - app.api.ai_proxy - INFO - Calling AI Framework at http://ai-framework:8000/execute
ai-framework

INFO:     172.19.0.2:50356 - "POST /execute HTTP/1.1" 200 OK
backend     

2026-03-22 15:43:26 - httpx - INFO - HTTP Request: POST http://ai-framework:8000/execute "HTTP/1.1 200 OK"

2026-03-22 15:43:26 - app.api.ai_proxy - INFO - AI Framework response status: 200

2026-03-22 15:43:26 - app.api.ai_proxy - INFO - AI response success: True

2026-03-22 15:43:26 - app.api.ai_proxy - INFO - AI response keys: ['user_prompt', 'difficulty', 'depth_limit', 'user_id', 'outline_prompt', 'course_outline', '_llm_usage', 'course_outline_parsed', 'structure', 'course_title', 'course_description']

INFO:     172.19.0.1:39528 - "POST /api/v1/ai/generate/structure HTTP/1.1" 200 OK

INFO:     172.19.0.1:39528 - "POST /api/v1/courses HTTP/1.1" 201 Created

INFO:     172.19.0.1:39528 - "OPTIONS /api/v1/courses/329f1cf0-2187-4382-a138-e590d51dbdfc/nodes/batch HTTP/1.1" 200 OK

2026-03-22 15:43:26 - app.api.courses - INFO - Batch create nodes request for course 329f1cf0-2187-4382-a138-e590d51dbdfc

2026-03-22 15:43:26 - app.api.courses - INFO - Recalculated f_order for course 329f1cf0-2187-4382-a138-e590d51dbdfc: 191 lessons

INFO:     172.19.0.1:39528 - "POST /api/v1/courses/329f1cf0-2187-4382-a138-e590d51dbdfc/nodes/batch HTTP/1.1" 201 Created

INFO:     172.19.0.1:39528 - "GET /api/v1/courses HTTP/1.1" 200 OK
frontend    

 GET /course/329f1cf0-2187-4382-a138-e590d51dbdfc 200 in 1095ms (compile: 962ms, proxy.ts: 9ms, render: 124ms)
backend     

INFO:     172.19.0.1:45658 - "OPTIONS /api/v1/courses/329f1cf0-2187-4382-a138-e590d51dbdfc HTTP/1.1" 200 OK

INFO:     172.19.0.1:45664 - "OPTIONS /api/v1/auth/me HTTP/1.1" 200 OK

INFO:     172.19.0.1:45664 - "GET /api/v1/auth/me HTTP/1.1" 200 OK

INFO:     172.19.0.1:45658 - "GET /api/v1/courses/329f1cf0-2187-4382-a138-e590d51dbdfc HTTP/1.1" 200 OK
postgres    

2026-03-22 15:45:13.018 UTC [27] LOG:  checkpoint starting: time

2026-03-22 15:45:16.960 UTC [27] LOG:  checkpoint complete: wrote 40 buffers (0.2%); 0 WAL file(s) added, 0 removed, 0 recycled; write=3.912 s, sync=0.013 s, total=3.942 s; sync files=15, longest=0.004 s, average=0.001 s; distance=222 kB, estimate=222 kB; lsn=0/1A37E60, redo lsn=0/1A37E28