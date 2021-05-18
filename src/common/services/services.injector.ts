import { AuthService } from "../../auth/auth.service";
import { HederaService } from "./hedera.service";
import { NotificationService } from "./notifications.service";
import { PaymentsService } from "./payments.service";
import { TransactionsService } from "./transactions.service";
import { UsersService } from "./users.service";

export const authService = new AuthService();
export const hederaService = new HederaService();
export const notificationsService = new NotificationService();
export const paymentsService = new PaymentsService();
export const usersService = new UsersService();
export const transactionsService = new TransactionsService();
