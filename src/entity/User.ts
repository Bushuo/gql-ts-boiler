import {
    Entity,
    Column,
    BaseEntity,
    PrimaryGeneratedColumn,
    BeforeInsert
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity()
export class User extends BaseEntity {
    // because ppl cant guess this
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { nullable: true })
    twitterId: string | null;

    @Column('varchar', { length: 255, nullable: true })
    email: string | null;

    @Column('text', { nullable: true })
    password: string | null;

    @Column('boolean', { default: false })
    confirmed: boolean;

    @Column('boolean', { default: false })
    forgotPasswordLocked: boolean;

    @BeforeInsert()
    async hashPasswordBeforeInsert() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }
}
