import { GuildData } from "../types";
import { Core } from "../index";


export default function guildDataToViewString(g: GuildData, maxLength?: number, errorMessage?: string) {
  let gd = JSON.parse(JSON.stringify(g));
  if (gd) {
    delete gd['channelInstance'];
    delete gd['roleInstance'];
    gd.shard = gd.sharder % Core.options.shardCount;
  }

  let guilddata = `\`\`\`json\n${JSON.stringify(gd || { error: 'Guild Data Error' }, null, 2)}\`\`\``;
  if (guilddata.length > (maxLength | 1024)) guilddata = `\`\`\`json\n${JSON.stringify(gd || { error: 'Guild Data Error' }, null, 1)}\`\`\``;
  if (guilddata.length > (maxLength | 1024)) guilddata = `\`\`\`json\n${JSON.stringify(gd || { error: 'Guild Data Error' })}\`\`\``;
  if (guilddata.length > (maxLength | 1024)) {
    console.log(JSON.stringify(gd, null, 2));
    guilddata = errorMessage || 'Guild data too long. Check logs.';
  }

  return guilddata;
}
