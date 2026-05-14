# LogiStock — Gestion commandes & stock

Plateforme **LogiStock** : gestion des commandes, du stock et du suivi colis.
Charte : **rouge vif (#E10600) · noir · blanc**.

Stack : **Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma · NextAuth · Recharts**.
SQLite par défaut pour démarrer instantanément (basculable vers PostgreSQL en 30 secondes).

---

## Fonctionnalités

- **Tableau de bord** — CA, bénéfice net, commandes, stock, graphiques 12 mois, commandes récentes
- **Commandes** — création multi-articles, statuts, recherche, filtres, pagination, export CSV, import CSV, facture imprimable (PDF via le navigateur)
- **Stock** — produits avec SKU, prix d'achat/vente, fournisseur, image, alertes stock faible, historique mouvements
- **Suivi colis** — génération automatique du lien de suivi par transporteur, message client copiable + boutons WhatsApp / Email
- **Finances** — bénéfice par produit, marge moyenne, top produits, graphiques mensuels
- **Multi-utilisateurs** — rôles ADMIN / STAFF, mots de passe hashés (bcrypt)
- **Sécurité** — NextAuth (JWT), Zod sur toutes les API, middleware de protection des routes
- **UI** — design Shopify/Linear, dark mode par défaut, responsive mobile + desktop, animations fluides
- **Activité** — historique des actions

---

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Initialiser la base et charger les données de démo
npm run db:push
npm run db:seed

# 3. Lancer le serveur de dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Comptes de démonstration

| Rôle           | Email                          | Mot de passe | Accès                  |
| -------------- | ------------------------------ | ------------ | ---------------------- |
| 👑 Propriétaire | admin@logistock.local      | admin123     | Illimité (sans paywall) |
| 👤 Client      | client@logistock.local     | client123    | Essai gratuit 14 jours  |

## 💳 Modèle économique

L'application est un **SaaS payant à 14,99 € / mois**.
- **14 jours d'essai gratuit** pour tout nouveau compte
- Au-delà, l'accès est verrouillé et redirige vers la page d'abonnement
- Bouton "Souscrire" dans `/billing` activé pour 30 jours par paiement
- Le rôle `OWNER` (toi) n'est jamais soumis au paywall

---

## Passer en PostgreSQL

1. Modifier `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Définir `DATABASE_URL` dans `.env` :
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/logistock"
   ```
3. Régénérer / pousser :
   ```bash
   npm run db:reset
   ```

---

## Variables d'environnement

Voir `.env.example`. À régénérer en production :

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
```

---

## Scripts

| Commande            | Action                                                |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Serveur de développement                              |
| `npm run build`     | Build production (génère le client Prisma)            |
| `npm run start`     | Lance le build production                             |
| `npm run db:push`   | Synchronise le schéma Prisma → DB                     |
| `npm run db:seed`   | Charge les données de démonstration                   |
| `npm run db:reset`  | Reset complet + seed                                  |

---

## Architecture

```
src/
├── app/
│   ├── (app)/                 # Routes protégées avec layout sidebar
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── products/          # gestion stock
│   │   ├── tracking/          # générateur message client
│   │   ├── finance/
│   │   ├── users/
│   │   └── activity/
│   ├── api/                   # API REST (Next route handlers)
│   │   ├── orders/[+ export, import, invoice]
│   │   ├── products/[+ stock]
│   │   ├── stats/
│   │   └── users/
│   ├── login/                 # page de connexion
│   ├── globals.css            # design tokens + thème dark
│   └── layout.tsx
├── components/                # composants réutilisables (sidebar, topbar, charts, ui/*)
├── lib/                       # prisma, auth, utils, stats
├── types/                     # next-auth augmentation
└── middleware.ts              # protection des routes
prisma/
├── schema.prisma              # modèles complets
└── seed.ts                    # données démo
```

---

## API REST

| Méthode  | URL                              | Description                         |
| -------- | -------------------------------- | ----------------------------------- |
| GET/POST | `/api/orders`                    | Liste/crée des commandes            |
| GET/PATCH/DELETE | `/api/orders/:id`        | Détail/modification/suppression     |
| GET      | `/api/orders/export`             | Export CSV                          |
| POST     | `/api/orders/import`             | Import CSV (corps = texte CSV)      |
| GET      | `/api/orders/:id/invoice`        | Facture HTML imprimable             |
| GET/POST | `/api/products`                  | Liste/crée des produits             |
| PATCH/DELETE | `/api/products/:id`          | Modification/suppression            |
| POST     | `/api/products/:id/stock`        | Mouvement de stock (IN/OUT/ADJUST)  |
| GET      | `/api/stats`                     | Données dashboard                   |
| GET/POST | `/api/users`                     | Liste/crée des utilisateurs         |

Format CSV import :
```
customerName,customerEmail,customerPhone,customerAddress,sku,quantity,salePrice,costPrice,carrier,trackingNumber,status,notes
Marie Dupont,marie@x.com,+336...,12 rue ...,AUDIO-001,2,79.9,28.5,COLISSIMO,TRK123,SHIPPED,
```

---

## Sécurité

- Mots de passe hashés (bcryptjs, 10 rounds)
- Sessions JWT signées (`NEXTAUTH_SECRET`)
- Toutes les API vérifient la session
- Validation côté serveur via **Zod**
- Middleware Next.js protège `/dashboard`, `/orders`, `/products`, `/tracking`, `/finance`, `/users`, `/activity` et leurs API

---

## Déploiement

### Vercel + PostgreSQL (Neon, Supabase, etc.)

```bash
# Vercel envs
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://votredomaine.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
```

Au premier déploiement :
```bash
npx prisma migrate deploy
npm run db:seed   # optionnel, pour les données démo
```

---

## Licence

Code fourni à titre personnel — adaptez-le librement à vos besoins.
