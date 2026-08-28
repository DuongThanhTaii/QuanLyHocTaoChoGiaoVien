import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { Email } from '../../shared/value-objects';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface UserProps {
  email: Email;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  timezone: string;
  uiSettings?: {
    theme?: string;
    themeColor?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends AggregateRoot {
  private _email: Email;
  private _fullName: string;
  private _phone?: string;
  private _avatarUrl?: string;
  private _role: UserRole;
  private _timezone: string;
  private _uiSettings?: { theme?: string; themeColor?: string };
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: UserProps) {
    super(id);
    this._email = props.email;
    this._fullName = props.fullName;
    this._phone = props.phone;
    this._avatarUrl = props.avatarUrl;
    this._role = props.role;
    this._timezone = props.timezone || 'Asia/Ho_Chi_Minh';
    this._uiSettings = props.uiSettings;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(id: string, props: UserProps): Result<User> {
    if (!props.fullName || props.fullName.trim().length === 0) {
      return Result.fail(new Error("Full name is required"));
    }
    
    return Result.ok(new User(id, props));
  }

  // Getters
  get email(): Email { return this._email; }
  get fullName(): string { return this._fullName; }
  get role(): UserRole { return this._role; }
  get timezone(): string { return this._timezone; }
  get uiSettings(): { theme?: string; themeColor?: string } | undefined { return this._uiSettings; }
  
  updateProfile(fullName: string, phone?: string, avatarUrl?: string): Result<void> {
    if (!fullName || fullName.trim().length === 0) {
      return Result.fail(new Error("Full name cannot be empty"));
    }
    this._fullName = fullName;
    if (phone) this._phone = phone;
    if (avatarUrl) this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
    
    return Result.ok(undefined);
  }

  updateUiSettings(theme?: string, themeColor?: string): Result<void> {
    this._uiSettings = {
      ...this._uiSettings,
      ...(theme && { theme }),
      ...(themeColor && { themeColor })
    };
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }
}
