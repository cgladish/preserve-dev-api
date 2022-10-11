-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "sub" TEXT NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "displayName" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "App" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snippet" (
    "id" SERIAL NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "title" VARCHAR(50),
    "appSpecificDataJson" VARCHAR(1000),
    "creatorId" INTEGER,
    "appId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Snippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetInteraction" (
    "id" SERIAL NOT NULL,
    "snippetId" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SnippetInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(4000) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "appSpecificDataJson" VARCHAR(2000),
    "authorUsername" VARCHAR(50) NOT NULL,
    "authorIdentifier" VARCHAR(50),
    "authorAvatarUrl" VARCHAR(150),
    "snippetId" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "snippetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_sub_username_idx" ON "User"("sub", "username");

-- CreateIndex
CREATE INDEX "Snippet_createdAt_idx" ON "Snippet"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetInteraction_snippetId_key" ON "SnippetInteraction"("snippetId");

-- CreateIndex
CREATE INDEX "SnippetInteraction_snippetId_idx" ON "SnippetInteraction"("snippetId");

-- CreateIndex
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");

-- CreateIndex
CREATE INDEX "Comment_snippetId_createdAt_idx" ON "Comment"("snippetId", "createdAt");

-- AddForeignKey
ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetInteraction" ADD CONSTRAINT "SnippetInteraction_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
