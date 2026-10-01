-- ============================================================
-- Seed : plans d'abonnement par défaut (prix modifiables ensuite
-- depuis l'interface Super Admin). Idempotent via un nom unique.
-- ============================================================

insert into subscription_plans (name, period, price, description, features, status)
select 'Journalier', 'daily', 5000,
       'Accès complet à la publication pour 24 heures.',
       array['Publications illimitées pendant 24h', 'Ajout d''images et médias', 'Publication d''événements'],
       'active'
where not exists (select 1 from subscription_plans where name = 'Journalier');

insert into subscription_plans (name, period, price, description, features, status)
select 'Mensuel', 'monthly', 50000,
       'Idéal pour les entreprises actives tout au long du mois.',
       array['Publications illimitées', 'Ajout d''images et médias', 'Publication d''événements', 'Statistiques de base'],
       'active'
where not exists (select 1 from subscription_plans where name = 'Mensuel');

insert into subscription_plans (name, period, price, description, features, status)
select 'Annuel', 'yearly', 1000000,
       'La meilleure valeur pour une présence continue sur l''année.',
       array['Publications illimitées', 'Ajout d''images et médias', 'Publication d''événements', 'Statistiques avancées', 'Support prioritaire'],
       'active'
where not exists (select 1 from subscription_plans where name = 'Annuel');
