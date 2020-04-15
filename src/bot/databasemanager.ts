import { FreeStuffBot, Core } from "../index";
import { Guild, TextChannel } from "discord.js";
import Database from "../database/database";
import { Long } from "mongodb";
import { GuildSetting, GuildData } from "../types";


export default class DatabaseManager {

  public constructor(bot: FreeStuffBot) {
    bot.on('ready', async () => {
      // Check if any guild is not in the database yet
      // Might happen when someone adds the bot while it's offline
      // Same with leaving guilds and removing them from the db then

      let dbGuilds = await Database.collection('guilds').find({ }).toArray();

      for (let guild of bot.guilds.values()) {
        if (!dbGuilds.find(g => g._id === guild.id))
          this.addGuild(guild);
      }

      for (let guild of dbGuilds) {
        if (!bot.guilds.get(guild._id))
          this.removeGuild(guild._id);
      }
    });

    bot.on('guildCreate', guild => {
      this.addGuild(guild);
    });

    bot.on('guildDelete', guild => {
      this.removeGuild(guild.id);
    });
  }

  public addGuild(guild: Guild) {
    Database
      .collection('guilds')
      .insertOne({
        _id: guild.id,
        channel: undefined,
        role: undefined,
        price: 3,
        settings: 0
      });
    // settings: _ _ _ _______
    // 0 0 0 0 0 0 0 0 0 0 0 0
    //           | | |  theme
    //           | | currency (on = usd, off = eur)
    //           | react with :free: emoji
    //           show trash games? 0 is no, 1 is yes
    //
  }

  public removeGuild(guildid: string) {
    Database
      .collection('guilds')
      .deleteOne({ _id: guildid });
  }

  public async getGuildData(guild: Guild): Promise<GuildData> {
    const obj = await Database
      .collection('guilds')
      .findOne({ _id: guild.id })
      .catch(console.error);
    if (!obj) return undefined;
    return this.parseGuildData(obj);
  }

  public parseGuildData(dbObject: any): GuildData {
    if (!dbObject) return undefined;
    return {
      id: dbObject._id,
      channel: dbObject.channel,
      channelInstance: dbObject.channel
        ? (Core.guilds.get(dbObject._id).channels.get((dbObject.channel as Long).toString()) as TextChannel)
        : undefined,
      settings: dbObject.settings,
      mentionRole: dbObject.role,
      mentionRoleInstance: dbObject.role
        ? (dbObject.role == 1
          ? Core.guilds.get(dbObject._id).defaultRole
          : Core.guilds.get(dbObject._id).roles.get((dbObject.role as Long).toString()))
        : undefined,
      currency: (dbObject.settings & 0b10000) == 0 ? 'euro' : 'usd',
      react: (dbObject.settings & 0b100000) != 0,
      trashGames: (dbObject.settings & 0b1000000) != 0,
      theme: dbObject.settings & 0b1111,
      price: dbObject.price
    }
  }

  public changeSetting(guild: Guild, current: GuildData, setting: GuildSetting, value: string | number | boolean) {
    const out = {};
    switch (setting) {
      case 'channel':
        out['channel'] = Long.fromString(value as string);
        break;
      case 'roleMention':
        out['role'] = value ? Long.fromString(value as string) : null;
        break;
      case 'theme':
        out['settings'] = ((current.settings >> 4) << 4) + (value as number);
        break;
      case 'currency':
        out['settings'] = (current.settings | 0b10000) ^ (value ? 0 : 0b10000);
        break;
      case 'react':
        out['settings'] = (current.settings | 0b100000) ^ (value ? 0 : 0b100000);
        break;
      case 'trash':
        out['settings'] = (current.settings | 0b1000000) ^ (value ? 0 : 0b1000000);
        break;
      case 'price':
        out['price'] = value as number;
        break;
    }
    Database
      .collection('guilds')
      .updateOne({ _id: guild.id }, { '$set': out });
  }

}