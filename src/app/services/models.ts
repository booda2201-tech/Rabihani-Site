export interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string;
  price: number;
  currency: string | null;
  categoryId: number;
  categoryName: string | null;
}

export interface AuctionWinner {
  userId: string;
  userName: string;
  winningPoints: number;
}

export interface AuctionRoom {
  id: number;
  name: string;
  product: Product;
  startPoints: number;
  startTime: string;
  endTime: string;
  /** Target points (price × 1.3) */
  limited: number;
  isCancelled: boolean;
  countryId: number;
  countryName: string | null;
  status: number;
  currentHighestBid: number | null;
  highestBidderName: string | null;
  highestBidAt: string | null;
  winner: AuctionWinner | null;
}

export interface ResetPasswordPayload {
  emailOrPhone: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Advertisement {
  id: number;
  title: string;
  imageUrl: string;
  description: string | null;
  countryId: number;
}
