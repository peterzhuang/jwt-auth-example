import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx } from 'type-graphql';
import { User } from './entity/User';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken'
import { MyContext } from './MyContext';

@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string
}

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return 'hi!'
    }

    @Query(() => [User])
    users() {
        return User.find();
    }

    @Mutation(() => Boolean)
    async register(
        @Arg('email', () => String) email: string,
        @Arg('password') password: string,
    ) {
        const hashedPassword = await hash(password, 12);
        try {
            await User.insert({
                email,
                password: hashedPassword
            });
        } catch (err) {
            console.log(err);
            return false;
        }
        return true;
    }



    @Mutation(() => LoginResponse)
    async login(
        @Arg('email', () => String) email: string,
        @Arg('password') password: string,
        @Ctx() { res }: MyContext
    ): Promise<LoginResponse> {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new Error('could not find user');
        }

        const valid = await compare(password, user.password)

        if (!valid) {
            throw new Error("bad password");
        }

        // login successful

        res.cookie('jid', sign({ userId: user.id, }, 'refresh', { expiresIn: '7d' }), { expires: new Date(Date.now() + 900000), httpOnly: true });

        return {
            accessToken: sign({ userId: user.id, }, 'secret', { expiresIn: '15m' })
        };
    }


}