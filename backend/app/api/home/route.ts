import { prisma } from '@/lib/db';
import { success } from '@/lib/response';

const DEFAULT_TAB_LIST = [
  { text: '精选推荐', key: 0 },
  { text: '夏日防晒', key: 1 },
  { text: '二胎大作战', key: 2 },
  { text: '人气榜', key: 3 },
  { text: '好评榜', key: 4 },
  { text: 'RTX 30', key: 5 },
  { text: '手机也疯狂', key: 6 },
];

export async function GET(): Promise<Response> {
  const banners = await prisma.banner.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  });

  const swiper = banners.map((item) => item.image);

  return success({
    swiper,
    tabList: DEFAULT_TAB_LIST,
    activityImg: null,
  });
}
