import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const appEntity = await prisma.app.create({ data: { name: "Discord" } });
  const userEntity = await prisma.user.create({
    data: {
      username: "crasken",
      displayName: "Crasken",
      sub: "google-oauth2|116644327347918921624",
    },
  });
  await prisma.snippet.create({
    data: {
      appId: appEntity.id,
      public: true,
      title: "Test snippet title",
      appSpecificDataJson: '{"key":"value"}',
      creatorId: userEntity.id,
      messages: {
        create: [
          {
            content: "what the",
            sentAt: "2022-09-08T22:53:43.675000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content:
              "https://clips.twitch.tv/IcySecretiveShrewBIRB-PSnHaGsigqnJSj-o",
            sentAt: "2022-09-08T19:57:24.440000+00:00",
            appSpecificDataJson:
              '{"attachments":[],"embeds":[{"type":"video","url":"https://clips.twitch.tv/IcySecretiveShrewBIRB-PSnHaGsigqnJSj-o","title":"Northernlion - forsenCD","description":"Watch Northernlion\'s clip titled \\"forsenCD\\"","provider":{"name":"Twitch"},"thumbnail":{"url":"https://clips-media-assets2.twitch.tv/ibSRbT0px2hrIoKpyUo_qA/AT-cm%7CibSRbT0px2hrIoKpyUo_qA-social-preview.jpg","proxy_url":"https://images-ext-2.discordapp.net/external/XtkS103WzG56XoxyghSAdkKfmgaMSYKMi_W_UDdQwcE/https/clips-media-assets2.twitch.tv/ibSRbT0px2hrIoKpyUo_qA/AT-cm%257CibSRbT0px2hrIoKpyUo_qA-social-preview.jpg","width":1920,"height":1080},"video":{"url":"https://clips.twitch.tv/embed?clip=IcySecretiveShrewBIRB-PSnHaGsigqnJSj-o&parent=meta.tag","width":640,"height":378}}]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "https://www.sba.gov/funding-programs/loans",
            sentAt: "2022-09-08T18:35:57.987000+00:00",
            appSpecificDataJson:
              '{"attachments":[],"embeds":[{"type":"link","url":"https://www.sba.gov/funding-programs/loans","title":"Loans","description":"Start or expand your business with loans guaranteed by the Small Business Administration. Use Lender Match to find lenders that offer loans for your business.","provider":{"name":"Loans"},"thumbnail":{"url":"https://content.sba.gov/sites/default/files/2020-05/SBASEOImage.jpg","proxy_url":"https://images-ext-2.discordapp.net/external/LT92wGNZFWzyHVS8bNeXvSmQAZMJD0AvHISf1EH3vc4/https/content.sba.gov/sites/default/files/2020-05/SBASEOImage.jpg","width":1200,"height":600}}]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "but we might not want to be in michigan / minnesota",
            sentAt: "2022-09-08T17:06:19.455000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "also I'm not sure how fucky the tax situation works",
            sentAt: "2022-09-08T17:06:13.571000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "ok",
            sentAt: "2022-09-08T16:56:33.756000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content:
              "probably hold off until we have a teacher or two using ut",
            sentAt: "2022-09-08T16:56:29.334000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "or should I start the conversation now",
            sentAt: "2022-09-08T16:33:00.862000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content:
              "when should I blow my load and message my old school principal",
            sentAt: "2022-09-08T16:32:53.142000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content:
              "https://www.reddit.com/r/AskMen/comments/x8fpd7/why_is_manslaughter_illegal/",
            sentAt: "2022-09-08T05:49:11.100000+00:00",
            appSpecificDataJson:
              '{"attachments":[],"embeds":[{"type":"link","url":"https://www.reddit.com/r/AskMen/comments/x8fpd7/why_is_manslaughter_illegal/","title":"r/AskMen - [NSFW] Why is manslaughter illegal?","description":"4,103 votes and 269 comments so far on Reddit","color":16777215,"provider":{"name":"reddit"}}]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "?",
            sentAt: "2022-09-08T04:48:15.965000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "plate up?",
            sentAt: "2022-09-08T04:38:16.596000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "hot dog",
            sentAt: "2022-09-08T04:38:14.075000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content:
              "https://docs.google.com/document/d/1gXvWrU65-Mde78WPZ6YMb_YwW8viaI2qkVlQbgXgAgM/edit?usp=sharing",
            sentAt: "2022-09-07T15:29:25.114000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "?",
            sentAt: "2022-09-07T03:29:05.946000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "ture",
            sentAt: "2022-09-06T19:03:11.573000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "",
            sentAt: "2022-09-06T18:50:19.015000+00:00",
            appSpecificDataJson:
              '{"attachments":[{"id":"1016782416158916628","filename":"unknown.png","size":739761,"url":"https://cdn.discordapp.com/attachments/276874870590013451/1016782416158916628/unknown.png","proxy_url":"https://media.discordapp.net/attachments/276874870590013451/1016782416158916628/unknown.png","width":611,"height":768,"content_type":"image/png"}],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "energy",
            sentAt: "2022-09-06T15:59:07.380000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "sigma male",
            sentAt: "2022-09-06T15:59:06.502000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "<:Sadge:823055221558738964>",
            sentAt: "2022-09-06T15:59:05.590000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "alone too",
            sentAt: "2022-09-06T15:59:01.508000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "gigachad pupy",
            sentAt: "2022-09-06T15:59:00.515000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "6-0",
            sentAt: "2022-09-06T15:58:56.978000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "nice",
            sentAt: "2022-09-06T15:58:56.039000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
          {
            content: "look at page 6",
            sentAt: "2022-09-06T15:58:13.779000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "https://www.speechwire.com/cdl314aaa.pdf",
            sentAt: "2022-09-06T15:58:11.877000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "IcySpawn",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/123142886437945345/6c8b0e113775bbc6b14131e69fc96011",
          },
          {
            content: "they're only overtime 5 too",
            sentAt: "2022-09-06T03:41:42.368000+00:00",
            appSpecificDataJson: '{"attachments":[],"embeds":[]}',
            authorUsername: "Crasken",
            authorAvatarUrl:
              "https://cdn.discordapp.com/avatars/91403530358775808/118670c2636c3ca9a045ad49a2b7d926",
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
