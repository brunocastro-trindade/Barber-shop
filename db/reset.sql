-- DESTRUTIVO. Apaga todas as tabelas do ControlCRM.
-- Rodado apenas por `npm run db:reset`, que se recusa a executar se houver
-- dados, a menos que você passe --force.
--
-- Use quando o formato das tabelas mudar durante o desenvolvimento. Depois de
-- existir barbearia real usando o sistema, isto deixa de ser uma opção: aí a
-- mudança tem que virar migração incremental.

drop table if exists despesas     cascade;
drop table if exists assinaturas  cascade;
drop table if exists planos       cascade;
drop table if exists fila_espera  cascade;
drop table if exists agendamentos cascade;
drop table if exists visitas      cascade;
drop table if exists clientes     cascade;
drop table if exists produtos     cascade;
drop table if exists servicos     cascade;
drop table if exists equipe       cascade;
drop table if exists convites     cascade;
drop table if exists barbeiros    cascade;
