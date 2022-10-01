import prisma from "./prisma";

describe("prisma", () => {
  it("idToExternalId converts ids correctly", async () => {
    expect(prisma.user.idToExternalId(1)).toEqual("E21K9jm");
    expect(prisma.user.idToExternalId(2)).toEqual("MBj8J1K");
  });

  it("externalIdToId converts ids correctly", async () => {
    expect(prisma.user.externalIdToId("E21K9jm")).toEqual(1);
    expect(prisma.user.externalIdToId("MBj8J1K")).toEqual(2);
  });
});
