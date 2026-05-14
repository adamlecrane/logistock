# 🚀 Déployer LogiStock en ligne

Suivez ce guide dans l'ordre. À la fin, votre application sera accessible publiquement
à une adresse du type `https://logistock.vercel.app`.

---

## ÉTAPE 1 — Base de données Neon (3 min)

1. Aller sur **https://neon.tech**
2. Cliquer **Sign up** → choisir GitHub ou Google
3. Cliquer **Create a project**
   - Project name : `logistock`
   - Region : **Europe (Frankfurt)** (le plus proche)
4. Cliquer **Create project**
5. Sur la page suivante, copier la **Connection string** affichée :
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
6. ⚠️ **La conserver précieusement dans un fichier texte** — on en aura besoin plusieurs fois.

---

## ÉTAPE 2 — Préparer le code pour PostgreSQL

Dans le Terminal :

```bash
cd "/Users/apple/claude code"
```

Ouvrir le fichier `prisma/schema.prisma` et changer **uniquement** :
```prisma
provider = "sqlite"
```
en
```prisma
provider = "postgresql"
```

---

## ÉTAPE 3 — Compte GitHub (5 min)

### 3.1 Créer un compte (si tu n'en as pas)
- https://github.com → **Sign up**

### 3.2 Créer le repository
1. Sur GitHub → bouton `+` en haut à droite → **New repository**
2. Repository name : `logistock`
3. **Private** (recommandé)
4. NE PAS cocher "Add a README"
5. **Create repository**

### 3.3 Pousser le code

Dans le Terminal, remplace `TON_USERNAME` par ton pseudo GitHub :

```bash
cd "/Users/apple/claude code"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/logistock.git
git push -u origin main
```

> Si Git demande un mot de passe, il faut un **Personal Access Token** :
> https://github.com/settings/tokens → Generate new token (classic) → cocher `repo` → Generate → utiliser ce token comme mot de passe.

---

## ÉTAPE 4 — Déployer sur Vercel (3 min)

1. https://vercel.com → **Sign up** avec GitHub
2. Plan **Hobby (Free)**
3. Sur le dashboard → **Add New** → **Project**
4. Trouver `logistock` dans la liste → **Import**
5. Sur la page de configuration, ouvrir **Environment Variables** et ajouter :

   | Nom | Valeur |
   |---|---|
   | `DATABASE_URL` | (l'URL Neon copiée à l'étape 1) |
   | `NEXTAUTH_SECRET` | (généré ci-dessous) |
   | `NEXTAUTH_URL` | `https://logistock.vercel.app` (URL provisoire) |
   | `SEED_ADMIN_EMAIL` | `admin@logistock.com` |
   | `SEED_ADMIN_PASSWORD` | (mot de passe fort à choisir) |

   Pour générer `NEXTAUTH_SECRET`, dans le Terminal :
   ```bash
   openssl rand -base64 32
   ```

6. **Deploy** → attendre 2-3 min ⏳

---

## ÉTAPE 5 — Initialiser la base distante

Une fois le déploiement terminé, dans le Terminal local — en remplaçant l'URL :

```bash
cd "/Users/apple/claude code"
DATABASE_URL="postgresql://user:pass@ep-xxx.../neondb?sslmode=require" npx prisma db push
```

Puis pour créer les comptes admin :

```bash
DATABASE_URL="postgresql://user:pass@..." SEED_ADMIN_EMAIL="admin@logistock.com" SEED_ADMIN_PASSWORD="ton-mot-de-passe-fort" npm run db:seed
```

---

## ÉTAPE 6 — Mettre à jour NEXTAUTH_URL avec l'URL réelle

1. Sur **vercel.com** → ton projet → **Settings** → **Environment Variables**
2. Modifier `NEXTAUTH_URL` avec la vraie URL fournie par Vercel
3. Onglet **Deployments** → cliquer sur les `...` du dernier → **Redeploy**

---

## ✅ C'est en ligne !

Ton URL publique : `https://logistock-xxx.vercel.app`

### 📱 Ajouter à l'écran d'accueil

**iPhone (Safari)** :
- Ouvrir l'URL
- Bouton Partager ⬆️
- **Sur l'écran d'accueil**

**Android (Chrome)** :
- Menu ⋮ → **Ajouter à l'écran d'accueil**

L'icône LogiStock apparaît comme une vraie application native.

---

## 🔁 Mises à jour futures

À chaque modification du code :

```bash
git add .
git commit -m "description du changement"
git push
```

Vercel redéploie automatiquement en 1-2 min.

---

## 💳 Activer les vrais paiements (plus tard)

Le bouton "Souscrire 14,99€" est actuellement simulé.
Pour encaisser réellement, brancher **Stripe Checkout** — environ 30 min de config.
Demandez-moi quand vous serez prêt.
