# EU TENHO BIZÚ

Plataforma PWA responsiva para PC e celular, com React + Vite + Supabase.

## 1. Instalar
```bash
npm install
```

## 2. Configurar Supabase
Crie um projeto gratuito no Supabase.
Abra SQL Editor e execute `supabase/schema.sql`.

Depois copie `.env.example` para `.env` e preencha:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## 3. Rodar
```bash
npm run dev
```

## 4. Publicar gratuitamente
O projeto pode ser publicado no Vercel ou Netlify no plano gratuito. Para Vercel:
- conecte o repositório GitHub;
- configure as duas variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY;
- faça o deploy.

## 5. Tornar um usuário administrador
Depois de criar sua conta, no SQL Editor do Supabase execute:
```sql
update public.profiles
set role = 'admin'
where id = 'COLE_AQUI_O_ID_DO_USUARIO';
```

## Observação
Esta é a V1 estrutural. O próximo passo é completar o CRUD administrativo de matérias/questões, histórico detalhado, favoritos, cronômetro e controle comercial de acesso de 30 dias. O código já foi estruturado para funcionar responsivamente em PC e celular desde o início.